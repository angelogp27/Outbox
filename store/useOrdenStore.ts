"use client";

import { create } from "zustand";
import type { ItemOrden, EventoPasado } from "../types";

const PRESUPUESTO_DEFECTO = 8000;

// Datos sembrados: eventos pasados (snapshots completos, sin id de catálogo)
const EVENTOS_PASADOS_SEED: EventoPasado[] = [
  {
    id: "ev-2024-03",
    nombre: "Brand Activation — 120 Guests",
    items: [
      {
        producto: {
          nombre: "Folding Chairs Rental (unit)",
          proveedor: "Lima Event Rentals",
          precioAprox: 5.0,
          url: "https://alquilereslima.pe/sillas",
          imagen: "https://images.unsplash.com/photo-1506898667547-42e22a46e125?w=500&auto=format&fit=crop&q=80",
        },
        cantidad: 120,
      },
      {
        producto: {
          nombre: "Rectangular Table 2.4m Rental",
          proveedor: "Lima Event Rentals",
          precioAprox: 25.0,
          url: "https://alquilereslima.pe/mesas",
          imagen: "https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=500&auto=format&fit=crop&q=80",
        },
        cantidad: 15,
      },
      {
        producto: {
          nombre: "Disposable Cups Pack x 50",
          proveedor: "Eco Supplies Peru",
          precioAprox: 8.5,
          url: "https://ecoyura.pe/vasos",
          imagen: "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=500&auto=format&fit=crop&q=80",
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
