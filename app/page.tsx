"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useOrdenStore } from "../store/useOrdenStore";
import type { ItemOrden, ProductoBuscado } from "../types";

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
  const total = useOrdenStore((s) => s.total);
  const delta = useOrdenStore((s) => s.delta);
  const proveedoresUnicos = useOrdenStore((s) => s.proveedoresUnicos);
  const eventosPasados = useOrdenStore((s) => s.eventosPasados);

  const totalActual = total();
  const deltaActual = delta();
  const proveedores = proveedoresUnicos();
  const porcentajeUsado = Math.min((totalActual / presupuesto) * 100, 100);
  const seExcede = deltaActual < 0;

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
        if (productos[0]) {
          nuevosItems.push({
            producto: productos[0],
            cantidad: Math.max(1, Math.round((numPersonas ?? 0) * base.porPersona)),
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

  return (
    <main className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              🛒 Outbox
              <span className="text-zinc-500 font-normal text-sm ml-2">
                Copiloto de Compras
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {items.length === 0 && (
              <button
                onClick={cargarEjemplo}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition px-3 py-1.5 rounded border border-zinc-700 cursor-pointer"
              >
                ✨ Simular orden de prueba
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={limpiarOrden}
                className="text-xs text-zinc-500 hover:text-red-400 transition px-3 py-1.5 rounded border border-zinc-800 hover:border-red-900 cursor-pointer"
              >
                Vaciar orden
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-6">
          {/* Indicador de presupuesto */}
          <section className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Presupuesto
              </h2>
              <span className="text-xs text-zinc-500">
                {proveedores.length} proveedor{proveedores.length !== 1 && "es"}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  seExcede
                    ? "bg-red-500"
                    : porcentajeUsado > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
              />
            </div>

            {/* Cifras */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold font-mono">
                  S/ {totalActual.toFixed(2)}
                </span>
                <span className="text-zinc-500 text-sm ml-1">
                  / S/ {presupuesto.toLocaleString("en-US")}
                </span>
              </div>
              <div
                className={`text-right ${seExcede ? "text-red-400" : "text-emerald-400"}`}
              >
                <span className="text-sm font-medium">
                  {seExcede ? "Excedido" : "Disponible"}
                </span>
                <span className="block text-lg font-mono font-bold">
                  {seExcede ? "−" : ""}S/ {Math.abs(deltaActual).toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* Orden actual */}
          <section className="bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Orden actual
                {items.length > 0 && (
                  <span className="text-zinc-600 ml-2 font-normal normal-case">
                    ({items.length} ítem{items.length !== 1 && "s"})
                  </span>
                )}
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-zinc-600 text-sm">
                  La orden está vacía. Describe tu evento en el chat y el
                  agente armará la canasta.
                </p>
                <p className="text-zinc-700 text-xs mt-2">
                  Ejemplo: &quot;Activación de marca para 150 personas,
                  presupuesto S/ 8,000, entrega el viernes&quot;
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-800/50 transition"
                  >
                    {/* Info del producto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {item.producto.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                        <span className="truncate">
                          {item.producto.proveedor}
                        </span>
                        <span className="text-zinc-700">·</span>
                        <a
                          href={item.producto.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline shrink-0"
                        >
                          Ver fuente ↗
                        </a>
                      </div>
                    </div>

                    {/* Precio unitario */}
                    <div className="text-right text-xs text-zinc-500 shrink-0 w-20">
                      <span className="font-mono">
                        S/ {item.producto.precioAprox.toFixed(2)}
                      </span>
                      <span className="block text-zinc-600">c/u</span>
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          actualizarCantidad(index, item.cantidad - 1)
                        }
                        className="w-7 h-7 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm transition"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-mono">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          actualizarCantidad(index, item.cantidad + 1)
                        }
                        className="w-7 h-7 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0 w-24">
                      <span className="font-mono text-sm font-semibold">
                        S/{" "}
                        {(
                          item.producto.precioAprox * item.cantidad
                        ).toFixed(2)}
                      </span>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => removerItem(index)}
                      className="text-zinc-600 hover:text-red-400 transition text-lg shrink-0"
                      title="Quitar ítem"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer con proveedores */}
            {items.length > 0 && proveedores.length > 0 && (
              <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/50">
                <p className="text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-500">
                    Proveedores:{" "}
                  </span>
                  {proveedores.join(" · ")}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
