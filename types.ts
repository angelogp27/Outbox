// Contrato compartido del equipo — Hackathon "Agents, Everywhere"

/** Lo que devuelve Exa por producto (ya implementado en lib/exa/buscarProductos.ts) */
export type ProductoBuscado = {
  nombre: string;
  proveedor: string;
  precioAprox: number;
  url: string;
  imagen?: string;
};

/** Una línea de la orden guarda el producto completo, no un id de catálogo */
export type ItemOrden = {
  producto: ProductoBuscado;
  cantidad: number;
};

/** Orden en curso */
export type Orden = {
  items: ItemOrden[];
  presupuesto: number;
};

/** Snapshot de un evento pasado */
export type EventoPasado = {
  id: string;
  nombre: string;
  items: ItemOrden[];
};

/** Lo que dispara el flujo — mismo shape venga del sidebar o de WhatsApp */
export type MetaEvento = {
  tipoEvento: string;
  numPersonas: number;
  presupuesto: number;
  fecha: string;
};

/** Lo que se envía a Google Sheets al aprobar */
export type OrdenAprobada = {
  orden: Orden;
  total: number;
  proveedores: number;
  fecha: string;
};
