import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const task = body.task || "analizar_arquitectura_y_exportar";
    const sheet_name = body.sheet_name || "Auditoria_Arquitectura_Graphify";
    const share_email = body.share_email || "";

    const cwd = process.cwd();
    const handlerPath = path.join(cwd, ".agents", "agentes_personalizados", "handler.py");

    if (!fs.existsSync(handlerPath)) {
      return NextResponse.json(
        { success: false, error: `Handler no encontrado en: ${handlerPath}` },
        { status: 404 }
      );
    }

    // Identificar el ejecutable de python (prioridad: .venv local, fallback: python del sistema)
    const venvPythonWin = path.join(cwd, ".venv", "Scripts", "python.exe");
    const venvPythonUnix = path.join(cwd, ".venv", "bin", "python");
    
    let pythonBin = "python";
    if (fs.existsSync(venvPythonWin)) {
      pythonBin = venvPythonWin;
    } else if (fs.existsSync(venvPythonUnix)) {
      pythonBin = venvPythonUnix;
    }

    const payload = JSON.stringify({ task, sheet_name, share_email });

    return new Promise<Response>((resolve) => {
      execFile(
        pythonBin,
        [handlerPath, "--json", payload],
        { cwd, timeout: 30000 },
        (error, stdout, stderr) => {
          if (error && !stdout) {
            console.error("Error ejecutando agente Graphify:", error, stderr);
            return resolve(
              NextResponse.json(
                { success: false, error: error.message, stderr },
                { status: 500 }
              )
            );
          }

          try {
            const parsed = JSON.parse(stdout.trim());
            return resolve(NextResponse.json(parsed));
          } catch (parseError) {
            // Si el stdout tiene texto no json antes o después
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return resolve(NextResponse.json(parsed));
            }
            return resolve(
              NextResponse.json({
                success: false,
                raw_output: stdout,
                error: "No se pudo parsear salida JSON del agente"
              })
            );
          }
        }
      );
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
