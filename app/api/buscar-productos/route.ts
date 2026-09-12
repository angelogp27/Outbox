import { NextRequest, NextResponse } from "next/server";
import { buscarProductosConRespaldo as buscarProductos } from "@/lib/exa/buscarProductosConRespaldo";

// Envuelve buscarProductos en una API route porque necesita EXA_API_KEY —
// eso no puede llamarse directo desde un componente cliente (se filtraría la key
// al bundle del navegador). Las acciones del agente llaman a este endpoint.
export async function POST(req: NextRequest) {
  let body: { consulta?: unknown; numResults?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON valido." }, { status: 400 });
  }

  const { consulta, numResults } = body;

  if (!consulta || typeof consulta !== "string") {
    return NextResponse.json({ error: "Falta 'consulta' (string)" }, { status: 400 });
  }

  const limite =
    typeof numResults === "number" && Number.isFinite(numResults)
      ? Math.min(8, Math.max(1, Math.floor(numResults)))
      : 5;

  try {
    const productos = await buscarProductos(consulta.trim(), { numResults: limite });
    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error al buscar productos con Exa:", error);
    return NextResponse.json(
      { error: "No se pudo completar la busqueda con Exa." },
      { status: 502 }
    );
  }
}
