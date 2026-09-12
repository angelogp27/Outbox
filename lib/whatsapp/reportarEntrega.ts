import { enviarMensajeTexto } from "./evolutionClient";
import { linkGoogleSheets } from "@/lib/sheets/reportarGoogleSheets";
import type { OrdenAprobada } from "@/types";

// Salida del flujo: cuando la orden se aprueba (ver renderAndWaitForResponse
// en la acción de emitir, dueña Persona 3), se confirma por WhatsApp al mismo
// número que la disparó. No está en la ruta crítica de la demo (igual que
// reportarGoogleSheets): si falla, no debe tumbar la aprobación.

function formatearConfirmacion(aprobada: OrdenAprobada): string {
  const nItems = aprobada.orden.items.length;
  return (
    `✅ Orden aprobada\n` +
    `${nItems} ítem(s) · S/ ${aprobada.total.toFixed(2)} · ` +
    `${aprobada.proveedores} proveedor(es)\n` +
    `Entrega: ${aprobada.fecha}\n` +
    `Reporte en Sheets: ${linkGoogleSheets()}`
  );
}

export async function reportarEntregaWhatsApp(
  telefono: string,
  aprobada: OrdenAprobada
): Promise<void> {
  try {
    await enviarMensajeTexto(telefono, formatearConfirmacion(aprobada));
  } catch (err) {
    // No crítico: se loguea y se sigue. La demo no depende de esto.
    console.error("[whatsapp] no se pudo enviar la confirmación de entrega:", err);
  }
}
