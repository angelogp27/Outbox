import type { MetaEvento } from "@/types";

// Extractor heurístico (regex) de MetaEvento a partir del texto libre que
// llega por WhatsApp, p.ej.:
//   "Equipar una activación de marca para 150 personas, presupuesto S/ 8,000, entrega el viernes."
//
// Esto NO reemplaza el entendimiento del agente: cuando el mensaje llega al
// sidebar/runtime real (sync min 90), es el LLM el que interpreta la frase.
// Este parser solo sirve para poder probar el webhook con `curl`, en
// aislado, sin depender de que el resto de la app exista (ver equipo.md,
// entregable inmediato de Persona 4).

const RE_PERSONAS = /(\d+)\s*(personas|invitados|asistentes|pax)/i;
const RE_PRESUPUESTO = /(?:S\/\.?|soles)\s*([\d.,]+)/i;
const RE_FECHA = /entrega(?:\s+el)?\s+([a-záéíóúñ]+(?:\s+\d{1,2})?)/i;

function limpiarNumero(texto: string): number {
  return Number(texto.replace(/,/g, ""));
}

export function parseMensajeAMetaEvento(texto: string): MetaEvento {
  const personas = texto.match(RE_PERSONAS);
  const presupuesto = texto.match(RE_PRESUPUESTO);
  const fecha = texto.match(RE_FECHA);

  return {
    tipoEvento: texto.trim(),
    numPersonas: personas ? Number(personas[1]) : 0,
    presupuesto: presupuesto ? limpiarNumero(presupuesto[1]) : 0,
    fecha: fecha ? fecha[1].trim() : "",
  };
}
