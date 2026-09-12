import Exa from "exa-js";

// Reemplaza el catálogo sembrado: en lugar de leer seed.json, cada acción que
// necesita productos llama a esta función y busca en la web en vivo con Exa.
// Requiere EXA_API_KEY en el entorno (ver .env.local).

export type ProductoBuscado = {
  nombre: string;
  proveedor: string;
  precioAprox: number;
  url: string;
};

type BuscarProductosOpts = {
  numResults?: number;
};

const SYSTEM_PROMPT =
  "Devuelve productos reales en venta o alquiler en Perú, con precio en soles (S/). " +
  "Omite resultados sin precio verificable; nunca inventes un precio.";

const OUTPUT_SCHEMA = {
  type: "object",
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
  // La SDK instalada (exa-js 1.10.x) solo reconoce EXASEARCH_API_KEY como env var
  // implícita; pasamos EXA_API_KEY explícito para no depender de ese detalle interno.
  const exa = new Exa(process.env.EXA_API_KEY);

  const result = await exa.search(consulta, {
    type: "auto",
    systemPrompt: SYSTEM_PROMPT,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputSchema: OUTPUT_SCHEMA as any,
    contents: { highlights: true },
    ...(opts.numResults ? { numResults: opts.numResults } : {}),
  });

  const productos = (result as any).output?.content?.productos;
  return Array.isArray(productos) ? productos : [];
}
