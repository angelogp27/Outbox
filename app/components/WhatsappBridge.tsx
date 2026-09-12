"use client";

import { useEffect } from "react";
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";

// Puente WhatsApp → sidebar: hace polling al buzón (/api/whatsapp/mensajes,
// alimentado por Evolution API vía /api/whatsapp/webhook) e inyecta cada
// mensaje nuevo en el chat, como si el usuario lo hubiera tecleado. Desde ahí
// el flujo sigue igual que si se hubiera escrito directo en el sidebar.
//
// `appendMessage`/`TextMessage`/`Role` son la API v1 de CopilotKit (la misma
// que ya usan useCopilotAction/useCopilotReadable en app/page.tsx) — deprecated
// a favor de v2, pero funcional y consistente con el resto del proyecto.
const INTERVALO_MS = 2000;

export function WhatsappBridge() {
  const { appendMessage } = useCopilotChat();

  useEffect(() => {
    let cancelado = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/whatsapp/mensajes");
        const pendientes: { texto: string }[] = await res.json();
        for (const { texto } of pendientes) {
          if (cancelado) return;
          await appendMessage(new TextMessage({ content: texto, role: Role.User }));
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
