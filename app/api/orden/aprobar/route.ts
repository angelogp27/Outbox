import { NextRequest, NextResponse } from "next/server";
import { reportarGoogleSheets } from "@/lib/sheets/reportarGoogleSheets";
import { reportarEntregaWhatsApp } from "@/lib/whatsapp/reportarEntrega";
import { obtenerUltimoTelefono } from "@/lib/whatsapp/buzon";
import type { OrdenAprobada } from "@/types";

// Llamar aquí cuando el humano aprueba la orden (desde la acción de emitir
// con renderAndWaitForResponse, dueña Persona 3). Dispara los dos reportes
// post-aprobación, ninguno crítico: si fallan, no deben tumbar la aprobación.
// - Sheets: siempre.
// - WhatsApp: solo si la orden vino de WhatsApp (hay un teléfono asociado).
//
//   fetch("/api/orden/aprobar", {
//     method: "POST",
//     body: JSON.stringify({ ordenAprobada }),
//   });
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const ordenAprobada = body?.ordenAprobada as OrdenAprobada | undefined;
  if (!ordenAprobada) {
    return NextResponse.json({ ok: false, error: "falta ordenAprobada" }, { status: 400 });
  }

  await reportarGoogleSheets(ordenAprobada);

  const telefono = body?.telefono ?? obtenerUltimoTelefono();
  if (telefono) {
    await reportarEntregaWhatsApp(telefono, ordenAprobada);
  }

  return NextResponse.json({ ok: true, whatsapp: Boolean(telefono) });
}
