"use client";

import { create } from "zustand";
import type { ItemOrden, EventoPasado, ProductoBuscado } from "../types";

const PRESUPUESTO_DEFECTO = 8000;

// Datos sembrados: eventos pasados (snapshots completos, sin id de catálogo)
const EVENTOS_PASADOS_SEED: EventoPasado[] = [
  {
    id: "ev-2024-03",
    nombre: "Activación de marca — Marzo 2024 (120 personas)",
    items: [
      {
        producto: {
          nombre: "Sillas plegables alquiler x unidad",
          proveedor: "Alquileres Lima SAC",
          precioAprox: 5.0,
          url: "https://alquilereslima.pe/sillas",
        },
        cantidad: 120,
      },
      {
        producto: {
          nombre: "Mesa rectangular 2.4m alquiler",
          proveedor: "Alquileres Lima SAC",
          precioAprox: 25.0,
          url: "https://alquilereslima.pe/mesas",
        },
        cantidad: 15,
      },
      {
        producto: {
          nombre: "Vasos descartables paquete x 50",
          proveedor: "Eco Yura Perú",
          precioAprox: 8.5,
          url: "https://ecoyura.pe/vasos",
        },
        cantidad: 5,
      },
    ],
  },
];

interface OrdenState {
  // Estado
  items: ItemOrden[];
  presupuesto: number;
  eventosPasados: EventoPasado[];

  // Acciones sobre la orden
  agregarItem: (item: ItemOrden) => void;
  agregarItems: (items: ItemOrden[]) => void;
  removerItem: (index: number) => void;
  actualizarCantidad: (index: number, cantidad: number) => void;
  actualizarProducto: (
    index: number,
    producto: ProductoBuscado,
    cantidad: number
  ) => void;
  reemplazarItems: (items: ItemOrden[]) => void;
  limpiarOrden: () => void;
  setPresupuesto: (presupuesto: number) => void;

  // Derivados
  total: () => number;
  delta: () => number;
  proveedoresUnicos: () => string[];
}

export const useOrdenStore = create<OrdenState>((set, get) => ({
  items: [],
  presupuesto: PRESUPUESTO_DEFECTO,
  eventosPasados: EVENTOS_PASADOS_SEED,

  agregarItem: (item) =>
    set((s) => ({ items: [...s.items, item] })),

  agregarItems: (items) =>
    set((s) => ({ items: [...s.items, ...items] })),

  removerItem: (index) =>
    set((s) => ({ items: s.items.filter((_, i) => i !== index) })),

  actualizarCantidad: (index, cantidad) =>
    set((s) => ({
      items: s.items.map((item, i) =>
        i === index ? { ...item, cantidad: Math.max(1, cantidad) } : item
      ),
    })),

  actualizarProducto: (index, producto, cantidad) =>
    set((s) => ({
      items: s.items.map((item, i) =>
        i === index
          ? { ...item, producto, cantidad: Math.max(1, cantidad) }
          : item
      ),
    })),

  reemplazarItems: (items) => set({ items }),

  limpiarOrden: () => set({ items: [] }),

  setPresupuesto: (presupuesto) => set({ presupuesto }),

  total: () =>
    get().items.reduce(
      (sum, item) => sum + item.producto.precioAprox * item.cantidad,
      0
    ),

  delta: () => get().presupuesto - get().total(),

  proveedoresUnicos: () => [
    ...new Set(get().items.map((item) => item.producto.proveedor)),
  ],
}));
