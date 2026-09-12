import { parseMensajeAMetaEvento } from "./parseMensaje";
import type { MetaEvento } from "@/types";

// Forma (recortada) del payload que Evolution API POSTea al webhook para el
// evento MESSAGES_UPSERT. No es la forma completa oficial: solo los campos
// que necesitamos leer.
type PayloadEvolution = {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
    };
  };
};

export type MensajeEntrante = {
  telefono: string; // sin "@s.whatsapp.net", listo para usar en enviarMensajeTexto
  texto: string;
};

/**
 * Entrada del flujo: recibe el payload crudo de Evolution API y devuelve el
 * mensaje de texto entrante (o null si no aplica: eco de nuestro propio envío,
 * mensaje sin texto, evento que no es un mensaje nuevo, etc).
 */
export function extraerMensajeEntrante(payload: PayloadEvolution): MensajeEntrante | null {
  if (payload.event !== "messages.upsert") return null;

  const data = payload.data;
  if (!data || data.key?.fromMe) return null;

  const texto = data.message?.conversation ?? data.message?.extendedTextMessage?.text;
  const remoteJid = data.key?.remoteJid;
  if (!texto || !remoteJid) return null;

  return {
    telefono: remoteJid.replace(/@s\.whatsapp\.net$/, ""),
    texto,
  };
}

/**
 * Punto de entrada completo: del payload crudo a un MetaEvento listo para
 * `armarCanastaDesdeMeta`. Framework-agnostic a propósito: lo usa tanto el
 * server standalone (server/whatsappWebhook.ts) como, más adelante, la ruta
 * /api/whatsapp/webhook de Next.js (sync min 90).
 */
export function manejarWebhookEvolution(
  payload: PayloadEvolution
): { telefono: string; texto: string; meta: MetaEvento } | null {
  const mensaje = extraerMensajeEntrante(payload);
  if (!mensaje) return null;

  return {
    ...mensaje,
    meta: parseMensajeAMetaEvento(mensaje.texto),
  };
}
