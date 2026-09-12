// Cliente delgado sobre la REST API de Evolution API (self-hosted, Docker).
// Cubre lo mínimo que necesita el flujo: crear la instancia, vincularla por QR,
// apuntar su webhook a nuestro receptor, y mandar mensajes de vuelta (la
// "salida de entrega": confirmar por WhatsApp cuando se aprueba una orden).
//
// Requiere en el entorno: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
// (ver .env.local.example).

function env(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en el entorno (ver .env.local.example)`);
  return valor;
}

function baseUrl(): string {
  return env("EVOLUTION_API_URL").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: env("EVOLUTION_API_KEY"),
  };
}

async function llamar<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const cuerpo = await res.text().catch(() => "");
    throw new Error(`Evolution API ${res.status} en ${path}: ${cuerpo}`);
  }
  return res.json() as Promise<T>;
}

/** Crea la instancia (número de prueba) si no existe todavía. */
export async function crearInstancia(nombre = env("EVOLUTION_INSTANCE")) {
  return llamar(`/instance/create`, {
    method: "POST",
    body: JSON.stringify({
      instanceName: nombre,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

/** Devuelve el QR (base64) para vincular el número desde el celular. */
export async function obtenerCodigoQR(nombre = env("EVOLUTION_INSTANCE")) {
  return llamar<{ base64?: string; code?: string }>(`/instance/connect/${nombre}`);
}

/** Apunta el webhook de la instancia a nuestro receptor (entrada del flujo). */
export async function configurarWebhook(
  url: string,
  nombre = env("EVOLUTION_INSTANCE")
) {
  return llamar(`/webhook/set/${nombre}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url,
        events: ["MESSAGES_UPSERT"],
      },
    }),
  });
}

/**
 * Manda un mensaje de texto a un número (salida). Se usa para confirmar la
 * entrega/aprobación de la orden de vuelta al mismo chat que la disparó.
 * `numero` sin "+" ni espacios, p.ej. "51999999999".
 */
export async function enviarMensajeTexto(
  numero: string,
  texto: string,
  nombre = env("EVOLUTION_INSTANCE")
) {
  return llamar(`/message/sendText/${nombre}`, {
    method: "POST",
    body: JSON.stringify({
      number: numero,
      text: texto,
    }),
  });
}
