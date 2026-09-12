import { NextResponse } from "next/server";
import { sacarMensajesPendientes } from "@/lib/whatsapp/buzon";

// El sidebar (app/components/WhatsappBridge.tsx) hace polling aquí cada
// pocos segundos para inyectar mensajes de WhatsApp en el chat.
export async function GET() {
  return NextResponse.json(sacarMensajesPendientes());
}
