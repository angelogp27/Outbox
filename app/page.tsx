"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useOrdenStore, type ItemOrden } from "@/lib/store/useOrdenStore.mock";

// Ítems base para una activación de marca. La cantidad escala con numPersonas;
// esto es un punto de partida — Persona 3 lo afina (estimación real por tipo de evento).
const ITEMS_BASE = [
  { consulta: "vasos descartables para eventos por mayor, precio en soles, Lima Peru", porPersona: 1 },
  { consulta: "sillas plegables en alquiler para eventos, precio por unidad, Lima Peru", porPersona: 1 },
  { consulta: "gaseosa personal 500ml por mayor, precio en soles, Lima Peru", porPersona: 1 },
  { consulta: "bolsas de basura industriales por paquete, precio en soles, Lima Peru", porPersona: 1 / 50 },
];

export default function Home() {
  const { orden, setOrden } = useOrdenStore();
  // orden.presupuesto es la única fuente de verdad del presupuesto mostrado en pantalla.
  // El store también guarda un `presupuesto` suelto como valor semilla inicial, pero
  // mostrar ESE en vez de orden.presupuesto fue el bug: armarCanastaDesdeMeta actualiza
  // orden.presupuesto (vía setOrden), no el campo suelto, así que quedaba desactualizado.
  const presupuesto = orden.presupuesto;

  useCopilotReadable({
    description: "La orden de compra actual (ítems y presupuesto) que ve el usuario en pantalla",
    value: orden,
  });

  useCopilotAction({
    name: "armarCanastaDesdeMeta",
    description:
      "Arma la canasta de compras para un evento: busca cada ítem necesario en vivo (Exa) y llena la orden.",
    parameters: [
      { name: "tipoEvento", type: "string", description: "Tipo de evento, p.ej. activación de marca" },
      { name: "numPersonas", type: "number", description: "Número de personas del evento" },
      { name: "presupuestoEvento", type: "number", description: "Presupuesto del evento en soles" },
      { name: "fecha", type: "string", description: "Fecha de entrega" },
    ],
    handler: async ({ numPersonas, presupuestoEvento }) => {
      const items: ItemOrden[] = [];

      for (const base of ITEMS_BASE) {
        const res = await fetch("/api/buscar-productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consulta: base.consulta, numResults: 3 }),
        });
        const productos = await res.json();
        if (Array.isArray(productos) && productos[0]) {
          items.push({
            producto: productos[0],
            cantidad: Math.max(1, Math.round((numPersonas ?? 0) * base.porPersona)),
          });
        }
      }

      setOrden({ items, presupuesto: presupuestoEvento ?? presupuesto });
      return `Arme la orden con ${items.length} ítems buscados en vivo con Exa.`;
    },
  });

  const total = orden.items.reduce((acc, i) => acc + i.producto.precioAprox * i.cantidad, 0);

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Copiloto de compras — Orden actual</h1>
      <p>
        Presupuesto: S/ {presupuesto.toFixed(2)} — Gastado: S/ {total.toFixed(2)}
      </p>
      {orden.items.length === 0 ? (
        <p>Orden vacía. Describe el evento en el sidebar para empezar.</p>
      ) : (
        <ul>
          {orden.items.map((item, i) => (
            <li key={i}>
              {item.cantidad}× {item.producto.nombre} — S/ {item.producto.precioAprox} —{" "}
              {item.producto.proveedor} (
              <a href={item.producto.url} target="_blank" rel="noreferrer">
                link
              </a>
              )
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
