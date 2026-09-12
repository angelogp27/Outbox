# EQUIPO — Roles y especificaciones (4 personas, sprint de 4h)

## Contrato compartido (acordar los primeros 10 min, ANTES de dividirse)
Todo el equipo depende de estas formas de datos. Se definen juntos y no se tocan después
sin avisar al resto.

```ts
// types.ts
type Producto = {
  id: string; nombre: string; categoria: string; precioUnit: number;
  proveedor: string; stock: number; unidadesPorPaquete: number;
};
type ItemOrden = { productoId: string; cantidad: number };
type Orden = { items: ItemOrden[]; presupuesto: number };
type EventoPasado = { id: string; nombre: string; items: ItemOrden[] };
```

Estado global en Zustand (`useOrdenStore`): `catalogo`, `orden`, `presupuesto`, `filtro`,
`eventosPasados`. Todos leen/escriben de aquí — ninguna persona mantiene estado propio
paralelo.

## Persona 1 — Base de la app y datos (fundación, la primera en entregar)
**Responsabilidad:** que exista un esqueleto funcional sobre el que las otras 3 personas
puedan enchufarse cuanto antes.
- Scaffold Next.js (App Router + TypeScript).
- `seed.json`: 20–30 productos, 3–4 proveedores, presupuesto S/ 8,000; sembrar a propósito
  que la primera canasta sugerida se pase del presupuesto y que falten 2 esenciales
  (p.ej. vasos, bolsas de basura); 1–2 eventos pasados.
- `types.ts` y el store de Zustand (`useOrdenStore`).
- UI de catálogo (tarjetas/tabla, con filtro) + panel de "Orden actual" + indicador de
  presupuesto — sin lógica de agente todavía, solo que se vea y actualice si el store cambia.
- **Entrega en los primeros 30–40 min** para no bloquear al resto.

## Persona 2 — Plomería de CopilotKit
**Responsabilidad:** que el agente "vea" la pantalla y pueda hablar.
- Instalar `@copilotkit/react-core` y `@copilotkit/react-ui`.
- `<CopilotKit>` provider + `<CopilotSidebar>` en el layout.
- API route `/api/copilotkit` con `CopilotRuntime` conectado al LLM (OpenAI u OpenRouter).
- `useCopilotReadable`: expone catálogo visible, filtro actual, orden en curso y
  presupuesto (leyendo del store de la Persona 1).
- Prueba de humo: el agente responde en el sidebar y puede describir el estado en pantalla
  sin que se lo copien/peguen.
- **Depende de:** el store y los tipos de la Persona 1 (puede arrancar en paralelo con un
  store de prueba y reconectar apenas esté el real).

## Persona 3 — Lógica agéntica (el corazón de la demo)
**Responsabilidad:** las 4 acciones que mutan el estado + el paso de aprobación.
- `useCopilotAction` × 4, en este orden de prioridad:
  1. `armarCanastaDesdeMeta({tipoEvento, numPersonas, presupuesto, fecha})` — estima
     cantidades y llena la orden desde el catálogo.
  2. `validarYOptimizarPresupuesto` — si se pasa del presupuesto, propone sustituciones o
     ajusta cantidades, muestra el delta antes/después.
  3. `detectarEsencialesFaltantes` — señala ítems obvios olvidados para ese tipo/tamaño de
     evento.
  4. `consolidarPorProveedor` — agrupa la orden por proveedor.
- Acción de emitir orden con `renderAndWaitForResponse` (Aprobar / Editar / Cancelar).
- Tarjeta-resumen (generative UI) al aprobar: total, proveedores, fecha.
- Traza breve visible de qué decidió el agente y por qué (cantidades, sustituciones,
  faltantes).
- **Depende de:** store de la Persona 1 y plomería de la Persona 2. Puede escribir la
  lógica de estimación/optimización de forma aislada (funciones puras) mientras espera.

## Persona 4 — Integraciones post-aprobación + demo
**Responsabilidad:** lo que corre DESPUÉS de aprobar la orden, y que la demo salga bien.
- `notificarWhatsApp`: levantar Evolution API en Docker, vincular un número de prueba por
  QR, función que envía el resumen de la orden al aprobar. Bajo volumen (1–2 mensajes),
  nunca bloquea la demo si la sesión falla.
- `reportarGoogleSheets`: service account de Google, función que agrega una fila (fecha,
  ítems, total, proveedores) a una hoja al aprobar la orden.
- Ensayar el guion de demo (60–90 s) apenas la Persona 3 tenga el flujo completo.
- Grabar el video de respaldo con la corrida perfecta **antes de las 3:30**.
- README de 1 párrafo (problema, solución, rol de CopilotKit).
- **Depende de:** la acción de emitir orden (Persona 3) ya disparando un evento/callback al
  aprobar, para engancharse ahí.

## Orden temporal sugerido
1. **0–10 min:** las 4 personas acuerdan el contrato de tipos y el store.
2. **10–45 min:** Persona 1 entrega el esqueleto; 2, 3 y 4 arrancan en paralelo con mocks.
3. **45 min–2h30:** integración real conforme cada pieza va quedando lista.
4. **2h30–3h30:** ensayo del guion completo, fixes, integraciones de WhatsApp/Sheets.
5. **3h30–4h:** grabación del video de respaldo + README + pulido final.
