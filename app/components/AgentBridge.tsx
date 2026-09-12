"use client";

import type { ReactNode } from "react";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useOrdenStore } from "@/store/useOrdenStore";
import {
  calcularCantidadParaUnidades,
  obtenerUnidadesPorPresentacion,
} from "@/lib/producto";
import type { ItemOrden, ProductoBuscado } from "@/types";

const ITEMS_BASE = [
  { consulta: "vasos descartables para eventos por mayor, precio en soles, Lima Peru", porPersona: 1 },
  { consulta: "sillas plegables en alquiler para eventos, precio por unidad, Lima Peru", porPersona: 1 },
  { consulta: "gaseosa personal 500ml por mayor, precio en soles, Lima Peru", porPersona: 1 },
  { consulta: "bolsas de basura industriales por paquete, precio en soles, Lima Peru", porPersona: 1 / 50 },
];

async function buscar(consulta: string, numResults = 3): Promise<ProductoBuscado[]> {
  const respuesta = await fetch("/api/buscar-productos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consulta, numResults }),
  });

  if (!respuesta.ok) return [];
  const productos = await respuesta.json();
  return Array.isArray(productos) ? productos : [];
}

/** Conecta la nueva interfaz visual con las acciones de compra del agente. */
export function AgentBridge({ children }: { children: ReactNode }) {
  const items = useOrdenStore((state) => state.items);
  const presupuesto = useOrdenStore((state) => state.presupuesto);
  const total = useOrdenStore((state) => state.total);
  const delta = useOrdenStore((state) => state.delta);
  const proveedoresUnicos = useOrdenStore((state) => state.proveedoresUnicos);
  const reemplazarItems = useOrdenStore((state) => state.reemplazarItems);
  const agregarItems = useOrdenStore((state) => state.agregarItems);
  const setPresupuesto = useOrdenStore((state) => state.setPresupuesto);

  useCopilotReadable({
    description: "La orden actual que el usuario ve en pantalla.",
    value: {
      items,
      presupuesto,
      total: total(),
      disponible: delta(),
      proveedores: proveedoresUnicos(),
    },
  });

  useCopilotAction({
    name: "armarCanastaDesdeMeta",
    description:
      "Crea una orden nueva buscando productos reales con Exa. Úsala cuando el usuario describe un evento o una compra desde cero. No pidas más información si faltan tipo de evento o fecha: usa una estimación razonable. Reemplaza la orden actual.",
    parameters: [
      { name: "numPersonas", type: "number", description: "Número de asistentes; usa 1 si no se menciona.", required: false },
      { name: "presupuestoEvento", type: "number", description: "Presupuesto en soles si el usuario lo indicó.", required: false },
    ],
    handler: async ({ numPersonas, presupuestoEvento }) => {
      const personas = Math.max(1, Number(numPersonas) || 1);
      const resultados = await Promise.all(
        ITEMS_BASE.map(async (base): Promise<ItemOrden | null> => {
          const alternativas = (await buscar(base.consulta, 3))
            .filter((producto) => producto.tipoEnlace !== "catalogo")
            .sort((a, b) => {
              const prioridadA = a.tipoEnlace === "ficha" ? 0 : 1;
              const prioridadB = b.tipoEnlace === "ficha" ? 0 : 1;
              if (prioridadA !== prioridadB) return prioridadA - prioridadB;
              return a.precioAprox / obtenerUnidadesPorPresentacion(a) - b.precioAprox / obtenerUnidadesPorPresentacion(b);
            });
          const producto = alternativas[0];
          if (!producto) return null;
          return {
            producto,
            alternativas,
            cantidad: calcularCantidadParaUnidades(Math.ceil(personas * base.porPersona), producto),
          };
        })
      );

      const nuevosItems = resultados.filter((item): item is ItemOrden => item !== null);
      reemplazarItems(nuevosItems);
      if (Number(presupuestoEvento) > 0) setPresupuesto(Number(presupuestoEvento));
      return nuevosItems.length
        ? `Orden creada con ${nuevosItems.length} productos encontrados en vivo con Exa.`
        : "No encontré productos con precio verificable. Intenta nuevamente en unos minutos.";
    },
  });

  useCopilotAction({
    name: "ajustarOrden",
    description:
      "Busca y AGREGA productos a una orden que ya existe. Úsala para pedidos como 'agrega globos' o '20 bolsas'. Conserva todo lo que ya está en la orden.",
    parameters: [
      { name: "instruccion", type: "string", description: "Producto o cambio solicitado por el usuario." },
      { name: "cantidadPorItem", type: "number", description: "Cantidad a agregar de cada resultado; estima 10 si falta.", required: false },
    ],
    handler: async ({ instruccion, cantidadPorItem }) => {
      const productos = await buscar(`${instruccion} para eventos, precio en soles, Lima Peru`, 4);
      if (!productos.length) return `No encontré productos reales para "${instruccion}".`;
      agregarItems(productos.map((producto) => ({ producto, cantidad: Math.max(1, Number(cantidadPorItem) || 10) })));
      return `Agregué ${productos.length} opciones para "${instruccion}".`;
    },
  });

  return <>{children}</>;
}
