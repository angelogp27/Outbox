import { create } from "zustand";

// Mock para arrancar Persona 2 y 3 sin esperar a Persona 1. Mismo contrato que va a tener
// el store real (ver .context/equipo.md) — cuando Persona 1 publique su useOrdenStore,
// cambia el import por el suyo y el resto del código no debería moverse.

export type ProductoBuscado = {
  nombre: string;
  proveedor: string;
  precioAprox: number;
  url: string;
};

export type ItemOrden = { producto: ProductoBuscado; cantidad: number };
export type Orden = { items: ItemOrden[]; presupuesto: number };
export type EventoPasado = { id: string; nombre: string; items: ItemOrden[] };

type OrdenStore = {
  orden: Orden;
  presupuesto: number;
  eventosPasados: EventoPasado[];
  setOrden: (orden: Orden) => void;
  agregarItem: (item: ItemOrden) => void;
  quitarItem: (nombreProducto: string) => void;
  vaciarOrden: () => void;
};

const PRESUPUESTO_MOCK = 8000;

const ITEMS_MOCK: ItemOrden[] = [
  {
    producto: {
      nombre: "Vasos Descartables Transparentes 9 oz (paquete x 50)",
      proveedor: "Distribuidora Prolider",
      precioAprox: 4.9,
      url: "https://productosdelimpiezalima.com/cafeteria/descartables/vasos-descartables",
    },
    cantidad: 30,
  },
  {
    producto: {
      nombre: "Silla plegable para eventos (alquiler, unidad)",
      proveedor: "Alquiler Lima Eventos",
      precioAprox: 8,
      url: "https://example.com/sillas-alquiler",
    },
    cantidad: 150,
  },
  {
    producto: {
      nombre: "Gaseosa personal 500ml (unidad)",
      proveedor: "Distribuidora Andina",
      precioAprox: 2.5,
      url: "https://example.com/gaseosa-personal",
    },
    cantidad: 150,
  },
];

export const useOrdenStore = create<OrdenStore>((set) => ({
  orden: { items: ITEMS_MOCK, presupuesto: PRESUPUESTO_MOCK },
  presupuesto: PRESUPUESTO_MOCK,
  eventosPasados: [
    {
      id: "evt-marzo-2026",
      nombre: "Activación de marca — marzo 2026 (100 personas)",
      items: ITEMS_MOCK,
    },
  ],
  setOrden: (orden) => set({ orden }),
  agregarItem: (item) =>
    set((state) => ({ orden: { ...state.orden, items: [...state.orden.items, item] } })),
  quitarItem: (nombreProducto) =>
    set((state) => ({
      orden: {
        ...state.orden,
        items: state.orden.items.filter((i) => i.producto.nombre !== nombreProducto),
      },
    })),
  vaciarOrden: () => set((state) => ({ orden: { items: [], presupuesto: state.presupuesto } })),
}));
