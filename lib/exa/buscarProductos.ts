import Exa from "exa-js";
import "server-only";
import { clasificarCategoriaProducto } from "@/lib/categorias";
import { clasificarEnlaceProducto } from "@/lib/producto";
import type { ProductoBuscado } from "@/types";

// Reemplaza el catálogo sembrado: en lugar de leer seed.json, cada acción que
// necesita productos llama a esta función y busca en la web en vivo con Exa.
// Requiere EXA_API_KEY en el entorno (ver .env.local).

export type { ProductoBuscado } from "@/types";

type BuscarProductosOpts = {
  numResults?: number;
};

const SYSTEM_PROMPT =
  "Devuelve productos reales en venta o alquiler en Perú, con precio en soles (S/). " +
  "Omite resultados sin precio verificable; nunca inventes un precio.";

const PROMPT_ENLACE_FICHA =
  "Entrega solo la URL de la ficha exacta del producto; omite paginas de inicio, categoria, coleccion o resultados de busqueda. " +
  "Incluye unidadesPorPresentacion cuando la fuente o el nombre indique un paquete, caja o pack.";

const OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    productos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nombre: { type: "string" },
          precioAprox: { type: "number" },
          proveedor: { type: "string" },
          url: { type: "string" },
          unidadesPorPresentacion: { type: "number" },
        },
        required: ["nombre", "precioAprox", "proveedor", "url"],
      },
    },
  },
  required: ["productos"],
};

/**
 * Busca productos reales para un ítem del evento (p.ej. "vasos descartables para 150
 * personas") y devuelve una lista compacta con precio y proveedor, extraídos de páginas
 * reales vía Exa. No hay stock ni unidadesPorPaquete garantizados: eso vive dentro del
 * nombre/precio cuando la página lo expone (p.ej. "paquete x 50 unidades").
 */
export async function buscarProductos(
  consulta: string,
  opts: BuscarProductosOpts = {}
): Promise<ProductoBuscado[]> {
  const exa = new Exa(process.env.EXA_API_KEY);

  const result = await exa.search(consulta, {
    type: "auto",
    systemPrompt: `${SYSTEM_PROMPT} ${PROMPT_ENLACE_FICHA}`,
    outputSchema: OUTPUT_SCHEMA,
    contents: { highlights: true },
    ...(opts.numResults ? { numResults: opts.numResults } : {}),
  });

  const productos = (
    result as { output?: { content?: { productos?: unknown } } }
  ).output?.content?.productos;
  if (!Array.isArray(productos)) return [];

  return (productos as ProductoBuscado[]).map((producto) => {
    const productoNormalizado: ProductoBuscado = {
      ...producto,
      tipoEnlace: clasificarEnlaceProducto(producto.url),
      unidadesPorPresentacion:
        typeof producto.unidadesPorPresentacion === "number" &&
        producto.unidadesPorPresentacion > 0
          ? Math.floor(producto.unidadesPorPresentacion)
          : undefined,
    };

    return {
      ...productoNormalizado,
      categoria: clasificarCategoriaProducto(productoNormalizado),
    };
  });
}
