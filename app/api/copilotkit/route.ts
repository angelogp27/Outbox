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
    // Si no hay key configurada en .env.local, interceptar completions para responder
    // amigablemente dentro del chat en lugar de crashear con "Missing Authentication header"
    openai.chat.completions.create = (async function* () {
      yield {
        choices: [
          {
            delta: {
              role: "assistant",
              content:
                "⚠️ **Falta configurar `OPENROUTER_API_KEY`** en tu archivo `.env.local`.\n\n" +
                "Para que el agente pueda razonar y buscar productos en vivo:\n\n" +
                "1. Abre o crea el archivo `.env.local` en la raíz del proyecto.\n" +
                "2. Agrega tus credenciales (puedes basarte en `.env.example`):\n" +
                "```env\n" +
                "OPENROUTER_API_KEY=tu_api_key_aqui\n" +
                "OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free\n" +
                "EXA_API_KEY=tu_api_key_de_exa\n" +
                "```\n" +
                "3. Guarda el archivo y envía tu mensaje nuevamente.",
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
