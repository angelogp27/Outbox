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
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const serviceAdapter = new OpenAIAdapter({
    openai: openai as any,
    model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
  });

  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
