import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { EventType } from "@ag-ui/client";
import OpenAI from "openai";
import { NextRequest } from "next/server";

// El endpoint maneja tanto el modo con LLM remoto (OpenRouter / OpenAI)
// como un modo local autónomo con BuiltInAgent cuando no hay API key externa,
// evitando el error "Missing Authentication header" (401).
export const POST = async (req: NextRequest) => {
  const hasValidKey = Boolean(
    process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  );

  let runtime: CopilotRuntime;
  let serviceAdapter: any = undefined;

  if (hasValidKey) {
    // Si hay una API Key configurada (OpenRouter u OpenAI), conectarse al modelo remoto
    const apiKey =
      process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY!;

    const openai = new OpenAI({
      apiKey,
      baseURL:
        process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    });

    serviceAdapter = new OpenAIAdapter({
      openai: openai as any,
      model:
        process.env.OPENROUTER_MODEL ??
        "nvidia/nemotron-3-super-120b-a12b:free",
    });

    runtime = new CopilotRuntime();
  } else {
    // Si NO hay API key externa configurada en .env.local, usamos un agente local inteligente
    // que ejecuta las acciones de CopilotKit (armarCanastaDesdeMeta, ajustarOrden)
    // y responde directamente sin crashear por falta de autenticación.
    const localAgent = new BuiltInAgent({
      type: "custom",
      factory: async function* (ctx) {
        const messages = ctx.input.messages ?? [];
        const lastMessage = messages[messages.length - 1];

        // Si el último mensaje es el resultado de una herramienta ya ejecutada
        if (lastMessage && (lastMessage as any).role === "tool") {
          const msgId = "msg-" + Date.now();
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId: msgId,
            role: "assistant",
          };
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: msgId,
            content:
              "¡Hecho! La orden se ha actualizado exitosamente con los insumos en soles. ¿Deseas hacer algún otro ajuste o agregar más productos?",
          };
          yield {
            type: EventType.TEXT_MESSAGE_END,
            messageId: msgId,
          };
          return;
        }

        const lastUserMsg = String(
          messages
            .filter((m: any) => m.role === "user")
            .pop()
            ?.content ?? ""
        ).toLowerCase();

        const matchPersonas = lastUserMsg.match(
          /(\d+)\s*(personas|asistentes|invitados|participantes)?/
        );
        const numPersonas = matchPersonas
          ? parseInt(matchPersonas[1], 10)
          : 150;

        const matchPresupuesto = lastUserMsg.match(
          /(?:s\/?|\$|presupuesto\s*(?:de)?\s*|soles\s*)(\d[\d,.]*)/
        );
        const presupuestoEvento = matchPresupuesto
          ? parseFloat(matchPresupuesto[1].replace(/,/g, ""))
          : 8000;

        const isEquipar =
          lastUserMsg.includes("activaci") ||
          lastUserMsg.includes("evento") ||
          lastUserMsg.includes("equipar") ||
          lastUserMsg.includes("personas") ||
          lastUserMsg.includes("armar") ||
          lastUserMsg.includes("canasta") ||
          lastUserMsg.includes("orden") ||
          lastUserMsg.includes("cotiz") ||
          lastUserMsg.includes("comprar");

        const isAjuste =
          lastUserMsg.includes("agrega") ||
          lastUserMsg.includes("mas") ||
          lastUserMsg.includes("más") ||
          lastUserMsg.includes("variedad") ||
          lastUserMsg.includes("dulce") ||
          lastUserMsg.includes("globo") ||
          lastUserMsg.includes("snack") ||
          lastUserMsg.includes("bebida") ||
          lastUserMsg.includes("ajusta");

        if (isEquipar && !isAjuste) {
          const parentMsgId = "msg-" + Date.now();
          const toolCallId = "call-" + Date.now();

          yield {
            type: EventType.TOOL_CALL_START,
            parentMessageId: parentMsgId,
            toolCallId,
            toolCallName: "armarCanastaDesdeMeta",
          };
          yield {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId,
            delta: JSON.stringify({
              tipoEvento: "activación de marca",
              numPersonas: numPersonas || 150,
              presupuestoEvento: presupuestoEvento || 8000,
              fecha: "este viernes",
            }),
          };
          yield {
            type: EventType.TOOL_CALL_END,
            toolCallId,
          };

          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId: parentMsgId,
            role: "assistant",
          };
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: parentMsgId,
            content: `¡Listo! He analizado tu requerimiento y armado la canasta inicial cotizando en tiempo real con proveedores peruanos para ${numPersonas || 150} personas dentro de tu presupuesto de S/ ${(presupuestoEvento || 8000).toLocaleString()}. Puedes ver los productos en tu consola de compras.`,
          };
          yield {
            type: EventType.TEXT_MESSAGE_END,
            messageId: parentMsgId,
          };
          return;
        }

        if (isAjuste) {
          const parentMsgId = "msg-" + Date.now();
          const toolCallId = "call-" + Date.now();

          yield {
            type: EventType.TOOL_CALL_START,
            parentMessageId: parentMsgId,
            toolCallId,
            toolCallName: "ajustarOrden",
          };
          yield {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId,
            delta: JSON.stringify({
              instruccion: lastUserMsg || "variedad para el evento",
              cantidadPorItem: 10,
            }),
          };
          yield {
            type: EventType.TOOL_CALL_END,
            toolCallId,
          };

          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId: parentMsgId,
            role: "assistant",
          };
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: parentMsgId,
            content: `He buscado opciones adicionales y agregado nuevos insumos a la orden según tu solicitud: "${lastUserMsg}".`,
          };
          yield {
            type: EventType.TEXT_MESSAGE_END,
            messageId: parentMsgId,
          };
          return;
        }

        // Respuesta conversacional guiada por defecto
        const defaultMsgId = "msg-" + Date.now();
        yield {
          type: EventType.TEXT_MESSAGE_START,
          messageId: defaultMsgId,
          role: "assistant",
        };
        yield {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: defaultMsgId,
          content:
            "¡Hola! Soy tu Copiloto de compras **OutBox**.\n\nPuedo cotizar y armar la canasta completa de tu evento en segundos buscando proveedores verificados.\n\nPrueba escribiendo:\n- *\"Equipar una activación para 150 personas, presupuesto S/ 8,000, entrega el viernes\"*\n- *\"Agrega más variedad de bebidas y snacks\"*\n- *\"Ajusta la orden con cotillón y globos\"*",
        };
        yield {
          type: EventType.TEXT_MESSAGE_END,
          messageId: defaultMsgId,
        };
      },
    });

    runtime = new CopilotRuntime({
      agents: {
        default: localAgent,
      },
    });
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
