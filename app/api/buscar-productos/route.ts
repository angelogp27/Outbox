import { NextRequest, NextResponse } from "next/server";
import { buscarProductos } from "@/lib/exa/buscarProductos";

// Envuelve buscarProductos en una API route porque necesita EXA_API_KEY —
// eso no puede llamarse directo desde un componente cliente (se filtraría la key
// al bundle del navegador). Las acciones del agente llaman a este endpoint.
export async function POST(req: NextRequest) {
  const { consulta, numResults } = await req.json();

  if (!consulta || typeof consulta !== "string") {
    return NextResponse.json({ error: "Falta 'consulta' (string)" }, { status: 400 });
  }

  const productos = await buscarProductos(consulta, { numResults });
  return NextResponse.json(productos);
}
