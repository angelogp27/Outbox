import type { ProductoBuscado, TipoEnlaceProducto } from "@/types";

const RUTA_CATALOGO = /\/(?:categoria|categorias|category|categories|collections?|catalogo|catalog|search|busqueda|cafeteria|descartables)(?:\/|$)/i;
const RUTA_FICHA = /\/(?:producto|productos|product|products|p|item|detalle|detail)(?:\/|$)/i;

/** Clasifica la URL conservadoramente; una ruta ambigua no se presenta como ficha exacta. */
export function clasificarEnlaceProducto(url: string): TipoEnlaceProducto {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (RUTA_FICHA.test(pathname)) return "ficha";
    if (RUTA_CATALOGO.test(pathname)) {
      const segmentos = pathname.split("/").filter(Boolean);
      // Algunas tiendas anidan una ficha bajo rutas de categoría. No podemos
      // comprobarla sin navegar la página, así que no la descartamos ni la
      // presentamos como ficha exacta.
      if (segmentos.length >= 4) return "sin_verificar";
      return "catalogo";
    }
  } catch {
    return "sin_verificar";
  }

  return "sin_verificar";
}

/** Devuelve cuántas unidades cubre una presentación; sin evidencia, equivale a una unidad. */
export function obtenerUnidadesPorPresentacion(
  producto: ProductoBuscado
): number {
  if (
    typeof producto.unidadesPorPresentacion === "number" &&
    Number.isFinite(producto.unidadesPorPresentacion) &&
    producto.unidadesPorPresentacion > 0
  ) {
    return Math.floor(producto.unidadesPorPresentacion);
  }

  const nombre = producto.nombre.toLowerCase();
  const coincidencia = nombre.match(
    /(?:paquete|pack|caja|bolsa|fardo|display)?\s*(?:x|×)\s*(\d{1,5})\b/i
  ) ?? nombre.match(/\b(\d{1,5})\s*(?:unidades|uds?\.?|piezas|pz)\b/i);

  return coincidencia ? Math.max(1, Number(coincidencia[1])) : 1;
}

export function calcularCantidadParaUnidades(
  unidadesNecesarias: number,
  producto: ProductoBuscado
): number {
  return Math.max(
    1,
    Math.ceil(unidadesNecesarias / obtenerUnidadesPorPresentacion(producto))
  );
}
