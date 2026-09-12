import type { MensajeEntrante } from "./webhookHandler";
import type { MetaEvento } from "@/types";

// Puente entre el webhook (servidor) y el sidebar de CopilotKit (navegador).
// CopilotKit corre client-side (useCopilotAction necesita el estado de React),
// así que el webhook no puede "llamarle" directo al sidebar. La solución más
// simple para un hackathon: el webhook deja el mensaje aquí, y el frontend
// hace polling (cada 1-2s) a un endpoint que lee este buzón.
//
// Cuando exista la app Next.js, la integración es:
//
//   // app/api/whatsapp/mensajes/route.ts
//   import { sacarMensajesPendientes } from "@/lib/whatsapp/buzon";
//   export async function GET() {
//     return Response.json(sacarMensajesPendientes());
//   }
//
//   // en el componente del sidebar (Persona 2)
//   const { appendMessage } = useCopilotChat();
//   useEffect(() => {
//     const id = setInterval(async () => {
//       const pendientes = await fetch("/api/whatsapp/mensajes").then(r => r.json());
//       for (const m of pendientes) appendMessage(new TextMessage({ content: m.texto, role: Role.User }));
//     }, 1500);
//     return () => clearInterval(id);
//   }, []);

export type MensajeBuzon = MensajeEntrante & { meta: MetaEvento; recibidoEn: number };

const cola: MensajeBuzon[] = [];
let ultimoTelefono: string | null = null;

/** Llamado por el webhook cuando llega un mensaje nuevo de WhatsApp. */
export function encolarMensaje(mensaje: MensajeBuzon): void {
  cola.push(mensaje);
  ultimoTelefono = mensaje.telefono;
}

/** Llamado por el endpoint de polling: devuelve y vacía lo pendiente. */
export function sacarMensajesPendientes(): MensajeBuzon[] {
  return cola.splice(0, cola.length);
}

/**
 * Teléfono del último mensaje de WhatsApp recibido. Lo usa la acción de
 * emitir/aprobar (Persona 3) para saber a quién devolverle la confirmación
 * por `reportarEntregaWhatsApp` — null si el evento vino del sidebar directo.
 */
export function obtenerUltimoTelefono(): string | null {
  return ultimoTelefono;
}
