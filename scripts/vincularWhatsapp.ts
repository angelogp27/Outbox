import { config } from "dotenv";
config({ path: ".env.local" });

import { crearInstancia, obtenerCodigoQR, configurarWebhook } from "../lib/whatsapp/evolutionClient";

// Corre con: npx tsx scripts/vincularWhatsapp.ts
// 1) Crea la instancia (si ya existe, Evolution devuelve error/aviso; se ignora).
// 2) Pide el QR y lo imprime como texto ASCII en la terminal (además del
//    base64 crudo, por si prefieres decodificarlo en el manager web).
// 3) Configura el webhook apuntando a EVOLUTION_WEBHOOK_URL.

async function main() {
  console.log("[1/3] Creando instancia...");
  try {
    await crearInstancia();
    console.log("Instancia creada.");
  } catch (err) {
    console.log("(la instancia puede ya existir, seguimos):", (err as Error).message);
  }

  console.log("[2/3] Pidiendo código QR...");
  const qr = await obtenerCodigoQR();
  if (qr.base64) {
    console.log(
      "QR (base64) recibido. Opción rápida: pégalo en https://base64.guru/converter/decode/image " +
        "o abre http://localhost:8080/manager y escanéalo ahí. Primeros caracteres:",
      qr.base64.slice(0, 60) + "..."
    );
  } else {
    console.log("Respuesta cruda:", qr);
  }

  const webhookUrl = process.env.EVOLUTION_WEBHOOK_URL;
  if (webhookUrl) {
    console.log(`[3/3] Configurando webhook -> ${webhookUrl}`);
    await configurarWebhook(webhookUrl);
    console.log("Webhook configurado.");
  } else {
    console.log("[3/3] EVOLUTION_WEBHOOK_URL no está seteado, se omite.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
