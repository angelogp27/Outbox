import { createServer } from "node:http";
import { manejarWebhookEvolution } from "../lib/whatsapp/webhookHandler";
import { encolarMensaje, sacarMensajesPendientes } from "../lib/whatsapp/buzon";

// Entregable inmediato de Persona 4 (ver .context/equipo.md): un webhook que
// recibe el POST de Evolution API y lo transforma en un MetaEvento, probable
// con `curl`, sin depender de que la app Next.js exista todavía.
//
// Correr con:  npx tsx server/whatsappWebhook.ts
// Probar con:  curl -X POST http://localhost:3001/webhook/evolution \
//                -H 'Content-Type: application/json' -d @scripts/ejemplo-payload.json
//
// Cuando llegue el sync de min 90, esta misma lógica (manejarWebhookEvolution)
// se reusa dentro de app/api/whatsapp/webhook/route.ts, y en vez de solo
// loguear el MetaEvento se lo entrega al agente/CopilotRuntime.

const PUERTO = Number(process.env.WHATSAPP_WEBHOOK_PORT ?? 3001);

const server = createServer((req, res) => {
  // Simula el futuro app/api/whatsapp/mensajes/route.ts de Next.js: el
  // frontend haría polling aquí para sacar mensajes pendientes del buzón.
  if (req.method === "GET" && req.url === "/mensajes") {
    res.writeHead(200, { "Content-Type": "application/json" }).end(
      JSON.stringify(sacarMensajesPendientes())
    );
    return;
  }

  if (req.method !== "POST" || req.url !== "/webhook/evolution") {
    res.writeHead(404).end();
    return;
  }

  let cuerpo = "";
  req.on("data", (chunk) => (cuerpo += chunk));
  req.on("end", () => {
    try {
      const payload = JSON.parse(cuerpo || "{}");
      const resultado = manejarWebhookEvolution(payload);

      if (!resultado) {
        console.log("[whatsapp] evento ignorado (no es un mensaje entrante nuevo)");
      } else {
        console.log(`[whatsapp] mensaje de ${resultado.telefono}: "${resultado.texto}"`);
        console.log("[whatsapp] MetaEvento extraído:", resultado.meta);
        encolarMensaje({ ...resultado, recibidoEn: Date.now() });
      }

      res.writeHead(200, { "Content-Type": "application/json" }).end(
        JSON.stringify({ ok: true })
      );
    } catch (err) {
      console.error("[whatsapp] payload inválido:", err);
      res.writeHead(400).end(JSON.stringify({ ok: false }));
    }
  });
});

server.listen(PUERTO, () => {
  console.log(`[whatsapp] webhook escuchando en http://localhost:${PUERTO}/webhook/evolution`);
});
