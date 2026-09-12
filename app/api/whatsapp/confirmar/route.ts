import { NextRequest, NextResponse } from "next/server";
import { reportarEntregaWhatsApp } from "@/lib/whatsapp/reportarEntrega";
import { obtenerUltimoTelefono } from "@/lib/whatsapp/buzon";
import type { OrdenAprobada } from "@/types";

// Salida del flujo: llamar aquí cuando el humano aprueba la orden (desde la
// acción de emitir con renderAndWaitForResponse, dueña Persona 3), pasando el
// OrdenAprobada. Si no se manda `telefono`, se usa el del último WhatsApp
// recibido. No crítico: si Evolution falla, no debe tumbar la aprobación.
//
//   fetch("/api/whatsapp/confirmar", {
//     method: "POST",
//     body: JSON.stringify({ ordenAprobada }),
//   });
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const ordenAprobada = body?.ordenAprobada as OrdenAprobada | undefined;
  if (!ordenAprobada) {
    return NextResponse.json({ ok: false, error: "falta ordenAprobada" }, { status: 400 });
  }

  const telefono = body?.telefono ?? obtenerUltimoTelefono();
  if (!telefono) {
    // El evento vino del sidebar directo, no de WhatsApp: no hay a quién avisar.
    return NextResponse.json({ ok: true, enviado: false });
  }

  await reportarEntregaWhatsApp(telefono, ordenAprobada);
  return NextResponse.json({ ok: true, enviado: true });
}
