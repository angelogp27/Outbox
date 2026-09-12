"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  calcularCantidadParaUnidades,
  obtenerUnidadesPorPresentacion,
} from "@/lib/producto";
import { CATEGORIAS_COMPRA, clasificarCategoriaProducto } from "@/lib/categorias";
import { useOrdenStore } from "../store/useOrdenStore";
import type { ItemOrden, ProductoBuscado } from "../types";
import { OutBox } from "./components/OutBox";

// Ítems base para una activación de marca. La cantidad escala con numPersonas;
// esto es un punto de partida — se afina la estimación real por tipo de evento.
const ITEMS_BASE = [
  { consulta: "vasos descartables para eventos por mayor, precio en soles, Lima Peru", porPersona: 1 },
  { consulta: "sillas plegables en alquiler para eventos, precio por unidad, Lima Peru", porPersona: 1 },
  { consulta: "gaseosa personal 500ml por mayor, precio en soles, Lima Peru", porPersona: 1 },
  { consulta: "bolsas de basura industriales por paquete, precio en soles, Lima Peru", porPersona: 1 / 50 },
];

async function buscar(consulta: string, numResults = 3): Promise<ProductoBuscado[]> {
  const res = await fetch("/api/buscar-productos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consulta, numResults }),
  });
  const productos = await res.json();
  return Array.isArray(productos) ? productos : [];
}

export default function Home() {
  const items = useOrdenStore((s) => s.items);
  const presupuesto = useOrdenStore((s) => s.presupuesto);
  const removerItem = useOrdenStore((s) => s.removerItem);
  const actualizarCantidad = useOrdenStore((s) => s.actualizarCantidad);
  const limpiarOrden = useOrdenStore((s) => s.limpiarOrden);
  const reemplazarItems = useOrdenStore((s) => s.reemplazarItems);
  const setPresupuesto = useOrdenStore((s) => s.setPresupuesto);
  const agregarItems = useOrdenStore((s) => s.agregarItems);
  const actualizarProducto = useOrdenStore((s) => s.actualizarProducto);
  const total = useOrdenStore((s) => s.total);
  const delta = useOrdenStore((s) => s.delta);
  const proveedoresUnicos = useOrdenStore((s) => s.proveedoresUnicos);
  const eventosPasados = useOrdenStore((s) => s.eventosPasados);

  const totalActual = total();
  const deltaActual = delta();
  const proveedores = proveedoresUnicos();
  const porcentajeUsado = Math.min((totalActual / presupuesto) * 100, 100);
  const seExcede = deltaActual < 0;
  const gruposOrden = CATEGORIAS_COMPRA.map((categoria) => {
    const itemsCategoria = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => clasificarCategoriaProducto(item.producto) === categoria.id);
    const subtotal = itemsCategoria.reduce(
      (suma, { item }) => suma + item.producto.precioAprox * item.cantidad,
      0
    );
    const proveedoresCategoria = new Set(
      itemsCategoria.map(({ item }) => item.producto.proveedor)
    ).size;

    return { ...categoria, items: itemsCategoria, subtotal, proveedoresCategoria };
  }).filter((categoria) => categoria.items.length > 0);

  const cargarEjemplo = () => {
    if (eventosPasados.length > 0) {
      limpiarOrden();
      agregarItems(eventosPasados[0].items);
    }
  };

  useCopilotReadable({
    description: "La orden de compra actual (ítems y presupuesto) que ve el usuario en pantalla",
    value: { items, presupuesto, total: totalActual, delta: deltaActual, proveedores },
  });

  useCopilotAction({
    name: "armarCanastaDesdeMeta",
    description:
      "Arma la canasta de compras para un evento: busca cada ítem necesario en vivo (Exa) y llena la orden desde cero.",
    parameters: [
      { name: "tipoEvento", type: "string", description: "Tipo de evento, p.ej. activación de marca" },
      { name: "numPersonas", type: "number", description: "Número de personas del evento" },
      { name: "presupuestoEvento", type: "number", description: "Presupuesto del evento en soles" },
      { name: "fecha", type: "string", description: "Fecha de entrega" },
    ],
    handler: async ({ numPersonas, presupuestoEvento }) => {
      const nuevosItems: ItemOrden[] = [];

      for (const base of ITEMS_BASE) {
        const productos = await buscar(base.consulta, 3);
        const alternativas = productos
          .filter((producto) => producto.tipoEnlace !== "catalogo")
          .sort((a, b) => {
            const prioridadA = a.tipoEnlace === "ficha" ? 0 : 1;
            const prioridadB = b.tipoEnlace === "ficha" ? 0 : 1;
            if (prioridadA !== prioridadB) return prioridadA - prioridadB;
            return (
              a.precioAprox / obtenerUnidadesPorPresentacion(a) -
              b.precioAprox / obtenerUnidadesPorPresentacion(b)
            );
          });
        const productoElegido = alternativas[0];

        if (productoElegido) {
          nuevosItems.push({
            producto: productoElegido,
            alternativas,
            cantidad: calcularCantidadParaUnidades(
              Math.max(1, Math.ceil((numPersonas ?? 0) * base.porPersona)),
              productoElegido
            ),
          });
        }
      }

      reemplazarItems(nuevosItems);
      if (presupuestoEvento) setPresupuesto(presupuestoEvento);
      return `Arme la orden con ${nuevosItems.length} ítems buscados en vivo con Exa.`;
    },
  });

  useCopilotAction({
    name: "ajustarOrden",
    description:
      "Ajusta la orden YA ARMADA según un pedido libre del usuario (más variedad de un tipo de producto, agregar algo puntual, buscar una alternativa). Busca en vivo con Exa y AGREGA lo que encuentra a la orden existente, sin borrar lo que ya había.",
    parameters: [
      {
        name: "instruccion",
        type: "string",
        description: "El pedido en palabras del usuario, p.ej. 'más variedad de dulces' o 'agrega globos'",
      },
      {
        name: "cantidadPorItem",
        type: "number",
        description: "Cantidad aproximada a agregar por cada producto nuevo encontrado",
        required: false,
      },
    ],
    handler: async ({ instruccion, cantidadPorItem }) => {
      const productos = await buscar(`${instruccion} para eventos, precio en soles, Lima Peru`, 4);
      if (productos.length === 0) {
        return `No encontré productos reales para "${instruccion}".`;
      }
      const nuevosItems: ItemOrden[] = productos.map((producto) => ({
        producto,
        cantidad: cantidadPorItem ?? 10,
      }));
      agregarItems(nuevosItems);
      return `Agregué ${nuevosItems.length} opciones para "${instruccion}": ${productos
        .map((p) => p.nombre)
        .join(", ")}.`;
    },
  });

  const cambiarAlternativa = (index: number, producto: ProductoBuscado) => {
    const itemActual = items[index];
    if (!itemActual) return;

    const unidadesCubiertas =
      itemActual.cantidad * obtenerUnidadesPorPresentacion(itemActual.producto);
    actualizarProducto(
      index,
      producto,
      calcularCantidadParaUnidades(unidadesCubiertas, producto)
    );
  };

  return (
    <main className="min-h-screen bg-[#090a0f] text-[#f3f4f6] relative overflow-x-hidden flex flex-col items-center justify-start pb-20">
      <div className="w-full relative z-10">
        <OutBox />
      </div>
    </main>
  );
}
