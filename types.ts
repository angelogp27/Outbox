// Contrato compartido del equipo — Hackathon "Agents, Everywhere"

/** Calidad de la URL detectada; evita tratar un catálogo como una ficha exacta. */
export type TipoEnlaceProducto = "ficha" | "catalogo" | "sin_verificar";

export type CategoriaProducto =
  | "bebidas"
  | "alimentos"
  | "mobiliario"
  | "descartables"
  | "limpieza"
  | "decoracion"
  | "equipamiento"
  | "otros";

/** Lo que devuelve Exa por producto (ya implementado en lib/exa/buscarProductos.ts) */
export type ProductoBuscado = {
  nombre: string;
  proveedor: string;
  precioAprox: number;
  url: string;
  imagen?: string;
  tipoEnlace?: TipoEnlaceProducto;
  unidadesPorPresentacion?: number;
  categoria?: CategoriaProducto;
};

/** Una línea de la orden guarda el producto completo, no un id de catálogo */
export type ItemOrden = {
  producto: ProductoBuscado;
  cantidad: number;
  alternativas?: ProductoBuscado[];
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
