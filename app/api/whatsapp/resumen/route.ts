import { NextRequest, NextResponse } from "next/server";
import { enviarMensajeTexto } from "@/lib/whatsapp/evolutionClient";
import { linkGoogleSheets } from "@/lib/sheets/reportarGoogleSheets";
import { esUrlPublica } from "@/lib/urlPublica";

// Acuse de la primera respuesta (no la aprobación): lo llama WhatsappBridge
// justo después de que el agente arma/ajusta la orden a partir de un mensaje
// de WhatsApp. Arma el texto server-side para no tener que exponer el ID de
// la hoja de Sheets al navegador.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { telefono, cantidadItems, total } = body ?? {};
  if (!telefono) {
    return NextResponse.json({ ok: false, error: "falta telefono" }, { status: 400 });
  }

  const appUrl = process.env.APP_URL;
  const lineaApp = appUrl && esUrlPublica(appUrl) ? `Ve el detalle completo aquí: ${appUrl}\n` : "";
  const texto =
    `🧾 Arme tu orden: ${cantidadItems ?? 0} ítem(s), total S/ ${(total ?? 0).toFixed(2)}.\n` +
    lineaApp +
    `Reporte en Sheets: ${linkGoogleSheets()}`;

  try {
    await enviarMensajeTexto(telefono, texto);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[whatsapp] no se pudo enviar el resumen:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
