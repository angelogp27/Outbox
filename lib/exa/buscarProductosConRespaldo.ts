import { buscarProductos, type ProductoBuscado } from "./buscarProductos";
import cacheRespaldo from "./cacheRespaldo.json";

// Mitigación de riesgo para la demo: Exa es la única dependencia externa en
// la ruta crítica. Si la llamada en vivo tarda más de TIMEOUT_MS o falla, se
// cae al cache de respaldo (generado con `npx tsx scripts/generarCacheExa.ts`
// corriendo las consultas EXACTAS del guion — ver ese script).
//
// Uso: mismo shape que buscarProductos, drop-in replacement para las
// acciones que arman la canasta del guion de demo.

const TIMEOUT_MS = 6000;
const CACHE = cacheRespaldo as Record<string, ProductoBuscado[]>;

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promesa.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export async function buscarProductosConRespaldo(
  consulta: string,
  opts: { numResults?: number } = {}
): Promise<ProductoBuscado[]> {
  try {
    const productos = await conTimeout(buscarProductos(consulta, opts), TIMEOUT_MS);
    if (productos.length > 0) return productos;
    throw new Error("Exa devolvió 0 productos");
  } catch (err) {
    console.warn(`[exa] fallback a cache de respaldo para "${consulta}":`, (err as Error).message);
    return CACHE[consulta] ?? [];
  }
}
