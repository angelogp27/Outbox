import { NextRequest, NextResponse } from "next/server";
import { enviarMensajeTexto } from "@/lib/whatsapp/evolutionClient";

// Endpoint genérico de salida: manda un texto a un número de WhatsApp.
// Lo usa WhatsappBridge para el resumen de la primera respuesta, y queda
// disponible para cualquier otro aviso que se necesite mandar por WhatsApp.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { telefono, texto } = body ?? {};
  if (!telefono || !texto) {
    return NextResponse.json({ ok: false, error: "faltan telefono/texto" }, { status: 400 });
  }

  try {
    await enviarMensajeTexto(telefono, texto);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[whatsapp] no se pudo enviar el mensaje:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
