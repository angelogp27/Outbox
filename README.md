# Outbox — Copiloto de Compras por Lote

Copiloto agéntico incrustado en la consola de compras de una empresa. El encargado
describe un evento en UNA frase y el agente arma la orden completa: busca productos
reales en la web, estima cantidades, respeta el presupuesto, detecta faltantes y
consolida por proveedor — todo con confirmación humana antes de emitir.

**Stack:** Next.js (App Router) · TypeScript · CopilotKit · Zustand · Exa API

## Levantar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).
