import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

// El cliente se arma DENTRO del handler (no a nivel de módulo): si se instancia al
// importar el archivo, el build de Next falla apenas falte OPENROUTER_API_KEY, incluso
// sin haber recibido ningún request todavía.
export const POST = async (req: NextRequest) => {
  // LLM vía OpenRouter (compatible con el cliente de OpenAI: mismo SDK, otro baseURL).
  // Modelo gratuito por defecto — cambiar OPENROUTER_MODEL en .env.local si hace falta.
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "dummy-key-for-handshake";

  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn(
      "[copilotkit] AVISO: OPENROUTER_API_KEY o OPENAI_API_KEY no está configurada en .env.local"
    );
  }

  const hasValidKey = Boolean(
    process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  );

  const openai = new OpenAI({
    apiKey: apiKey || "dummy-key-for-handshake",
    baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  });

  if (!hasValidKey) {
    // Si no hay key configurada en .env.local, actuar como agente autónomo local
    // que ejecuta las acciones de CopilotKit y responde de forma natural sin crashear
    openai.chat.completions.create = (async function* (params: any) {
      const messages = params?.messages ?? [];
      const lastUserMsg = String(
        messages
          .filter((m: any) => m.role === "user")
          .pop()
          ?.content ?? ""
      ).toLowerCase();

      const matchPersonas = lastUserMsg.match(/(\d+)\s*(personas|asistentes|invitados)?/);
      const numPersonas = matchPersonas ? parseInt(matchPersonas[1], 10) : 150;

      const matchPresupuesto = lastUserMsg.match(/(?:s\/|\$|presupuesto\s*(?:de)?\s*)(\d[\d,.]*)/);
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
        lastUserMsg.includes("orden");

      if (isEquipar) {
        // Disparar tool call armarCanastaDesdeMeta
        yield {
          choices: [
            {
              delta: {
                role: "assistant",
                tool_calls: [
                  {
                    index: 0,
                    id: "call_" + Math.random().toString(36).slice(2, 9),
                    type: "function",
                    function: {
                      name: "armarCanastaDesdeMeta",
                      arguments: JSON.stringify({
                        tipoEvento: "activación de marca",
                        numPersonas: numPersonas || 150,
                        presupuestoEvento: presupuestoEvento || 8000,
                        fecha: "este viernes",
                      }),
                    },
                  },
                ],
              },
            },
          ],
        };

        yield {
          choices: [
            {
              delta: {
                content: `¡Listo! He analizado el requerimiento y armado la canasta inicial cotizando en tiempo real con proveedores peruanos para ${numPersonas || 150} personas dentro de tu presupuesto de S/ ${(presupuestoEvento || 8000).toLocaleString()}. Puedes ver los productos en tu consola de compras.`,
              },
            },
          ],
        };
        return;
      }

      // Si es un pedido de ajuste o agregar
      const isAjuste =
        lastUserMsg.includes("agrega") ||
        lastUserMsg.includes("mas") ||
        lastUserMsg.includes("más") ||
        lastUserMsg.includes("variedad") ||
        lastUserMsg.includes("dulce") ||
        lastUserMsg.includes("globo") ||
        lastUserMsg.includes("ajusta");

      if (isAjuste) {
        yield {
          choices: [
            {
              delta: {
                role: "assistant",
                tool_calls: [
                  {
                    index: 0,
                    id: "call_" + Math.random().toString(36).slice(2, 9),
                    type: "function",
                    function: {
                      name: "ajustarOrden",
                      arguments: JSON.stringify({
                        instruccion: lastUserMsg,
                        cantidadPorItem: 10,
                      }),
                    },
                  },
                ],
              },
            },
          ],
        };
        yield {
          choices: [
            {
              delta: {
                content: `He buscado opciones adicionales y agregado nuevos insumos a la orden según tu solicitud: "${lastUserMsg}".`,
              },
            },
          ],
        };
        return;
      }

      // Respuesta conversacional guiada
      yield {
        choices: [
          {
            delta: {
              role: "assistant",
              content:
                "¡Hola! Soy tu Copiloto de compras **OutBox**.\n\nPuedo cotizar y armar la canasta completa de tu evento en segundos buscando proveedores verificados.\n\nPrueba escribiendo algo como:\n\n> *\"Equipar una activación para 150 personas, presupuesto S/ 8,000, entrega el viernes\"*\n\nO pídeme agregar insumos específicos: *\"Agrega más variedad de bebidas\"*.",
            },
          },
        ],
      };
    }) as any;
  }

  const serviceAdapter = new OpenAIAdapter({
    openai: openai as any,
    model: process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free",
  });

  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
