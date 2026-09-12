import { NextRequest, NextResponse } from "next/server";
import { manejarWebhookEvolution } from "@/lib/whatsapp/webhookHandler";
import { encolarMensaje } from "@/lib/whatsapp/buzon";

// Entrada real del flujo: Evolution API llama aquí (POST) cuando llega un
// WhatsApp nuevo. Reemplaza a server/whatsappWebhook.ts para la demo real,
// porque este endpoint corre en el MISMO proceso que /api/whatsapp/mensajes
// (el `npm run dev` de Next.js) — el buzón en memoria solo se comparte así.
// El servidor standalone sigue sirviendo para probar en aislado sin la app.
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: false }, { status: 400 });

  const resultado = manejarWebhookEvolution(payload);
  if (resultado) {
    encolarMensaje({ ...resultado, recibidoEn: Date.now() });
  }

  return NextResponse.json({ ok: true });
}
