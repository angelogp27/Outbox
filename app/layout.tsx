"use client";

import "@copilotkit/react-ui/styles.css";
import "./globals.css";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

// Respaldo temporal mientras llega el scaffold oficial de Persona 1 — mismo
// contrato (types/store), se puede reemplazar sin tocar el resto del código.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Este build de CopilotKit hace `new URL(runtimeUrl)` sin base, así que exige
  // una URL absoluta — una relativa como "/api/copilotkit" revienta con "Invalid URL".
  const runtimeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/copilotkit`
      : "/api/copilotkit";

  return (
    <html lang="es">
      <body>
        <CopilotKit runtimeUrl={runtimeUrl}>
          {children}
          <CopilotSidebar
            labels={{
              title: "Copiloto de compras",
              initial:
                "Describe el evento en una frase: tipo, número de personas, presupuesto y fecha.",
            }}
          />
        </CopilotKit>
      </body>
    </html>
  );
}
