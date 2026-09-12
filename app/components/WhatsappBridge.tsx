"use client";

import { useEffect } from "react";
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { useOrdenStore } from "@/store/useOrdenStore";

// Puente WhatsApp → sidebar: hace polling al buzón (/api/whatsapp/mensajes,
// alimentado por Evolution API vía /api/whatsapp/webhook) e inyecta cada
// mensaje nuevo en el chat, como si el usuario lo hubiera tecleado. Desde ahí
// el flujo sigue igual que si se hubiera escrito directo en el sidebar.
//
// `appendMessage`/`TextMessage`/`Role` son la API v1 de CopilotKit (la misma
// que ya usan useCopilotAction/useCopilotReadable en app/page.tsx) — deprecated
// a favor de v2, pero funcional y consistente con el resto del proyecto.
//
// Después de que el agente responde (appendMessage con followUp resuelve
// cuando termina el turno completo, tool-calls incluidos), se manda de
// vuelta al mismo número un resumen + link a la app con el detalle. Esto NO
// es la confirmación de aprobación (esa es reportarEntregaWhatsApp, al
// aprobar la orden) — es el acuse de la primera respuesta.
const INTERVALO_MS = 2000;

type MensajeBuzon = { telefono: string; texto: string };

async function mandarResumen(telefono: string) {
  const { items, total } = useOrdenStore.getState();

  try {
    await fetch("/api/whatsapp/resumen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono, cantidadItems: items.length, total: total() }),
    });
  } catch {
    // no crítico: si falla, no debe romper el flujo del sidebar
  }
}

export function WhatsappBridge() {
  const { appendMessage } = useCopilotChat();

  useEffect(() => {
    let cancelado = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/whatsapp/mensajes");
        const pendientes: MensajeBuzon[] = await res.json();
        for (const { telefono, texto } of pendientes) {
          if (cancelado) return;
          await appendMessage(new TextMessage({ content: texto, role: Role.User }));
          if (cancelado) return;
          await mandarResumen(telefono);
        }
      } catch {
        // silencioso: el polling reintenta solo en el próximo tick
      }
    };

    const id = setInterval(poll, INTERVALO_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [appendMessage]);

  return null;
}
