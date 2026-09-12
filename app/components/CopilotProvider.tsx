"use client";

import "@copilotkit/react-ui/styles.css";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { WhatsappBridge } from "./WhatsappBridge";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  // Este build de CopilotKit hace `new URL(runtimeUrl)` sin base, así que exige
  // una URL absoluta — una relativa como "/api/copilotkit" revienta con "Invalid URL".
  const runtimeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/copilotkit`
      : "/api/copilotkit";

  return (
    <CopilotKit runtimeUrl={runtimeUrl}>
      <WhatsappBridge />
      {children}
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: "Copiloto de compras",
          initial:
            "Describe el evento en una frase: tipo, número de personas, presupuesto y fecha.",
        }}
      />
    </CopilotKit>
  );
}
