import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "node:fs";
import { buscarProductos } from "../lib/exa/buscarProductos";

// Corre las consultas EXACTAS que usa el guion de demo (ver ITEMS_BASE en
// app/page.tsx) y guarda los resultados como caché de respaldo. Volver a
// correr esto antes de la demo si las consultas del guion cambian.
const CONSULTAS_DEL_GUION = [
  "vasos descartables para eventos por mayor, precio en soles, Lima Peru",
  "sillas plegables en alquiler para eventos, precio por unidad, Lima Peru",
  "gaseosa personal 500ml por mayor, precio en soles, Lima Peru",
  "bolsas de basura industriales por paquete, precio en soles, Lima Peru",
];

async function main() {
  const cache: Record<string, Awaited<ReturnType<typeof buscarProductos>>> = {};

  for (const consulta of CONSULTAS_DEL_GUION) {
    console.log(`Buscando: "${consulta}"...`);
    cache[consulta] = await buscarProductos(consulta, { numResults: 3 });
    console.log(`  -> ${cache[consulta].length} productos encontrados.`);
  }

  writeFileSync("lib/exa/cacheRespaldo.json", JSON.stringify(cache, null, 2));
  console.log("Cache guardado en lib/exa/cacheRespaldo.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
