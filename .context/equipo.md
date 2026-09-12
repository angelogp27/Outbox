# EQUIPO — Roles y especificaciones (4 personas, sprint de 4h)

## Idea central: contrato primero, mocks después, nadie espera a nadie
El bloqueo típico de un hackathon es "yo no puedo avanzar hasta que el otro termine".
Se evita así: en los primeros 10 minutos las 4 personas acuerdan las FORMAS de datos
(abajo). A partir de ahí, cada quien construye su pieza contra ese contrato usando un
MOCK de lo que todavía no existe — nadie se queda mirando a otro trabajar. La integración
real ocurre en 2 puntos de sincronización cortos (min 45 y min 90), no en una entrega en
cadena.

## Ya construido (no lo repitan): `lib/exa/buscarProductos.ts`
El catálogo YA NO se siembra en `seed.json`: se reemplazó por búsqueda en vivo con la API
de Exa. La función `buscarProductos(consulta, { numResults? })` ya existe, está probada en
vivo (con la API key real, en `.env.local`) y devuelve `ProductoBuscado[]`. Persona 3 la
importa y la usa tal cual — nadie más necesita tocarla salvo para ajustar el `systemPrompt`
o el `outputSchema` si algo no rinde bien en ensayo.

## Contrato compartido (acordar entre los 4, primeros 10 min)
```ts
// lo que devuelve Exa por producto (ya implementado en lib/exa/buscarProductos.ts)
type ProductoBuscado = { nombre: string; proveedor: string; precioAprox: number; url: string };

// una línea de la orden AHORA guarda el producto completo, no un id de catálogo
// (ya no hay catálogo local contra el cual resolver un id)
type ItemOrden = { producto: ProductoBuscado; cantidad: number };
type Orden = { items: ItemOrden[]; presupuesto: number };
type EventoPasado = { id: string; nombre: string; items: ItemOrden[] }; // snapshot completo

// lo que dispara el flujo — mismo shape venga del sidebar o de WhatsApp
type MetaEvento = { tipoEvento: string; numPersonas: number; presupuesto: number; fecha: string };

// las 4 acciones — YA NO son funciones puras: arman/ajustan la orden llamando a
// buscarProductos (Exa), así que son async. Igual se prueban aisladas, sin React.
type ArmarCanasta      = (meta: MetaEvento) => Promise<Orden>;
type ValidarPresupuesto = (orden: Orden) =>
  Promise<{ orden: Orden; ajustada: boolean; delta?: { antes: number; despues: number } }>;
type DetectarFaltantes = (orden: Orden, meta: MetaEvento) => Promise<ItemOrden[]>; // ítems ya buscados, listos para agregar
type Consolidar        = (orden: Orden) => Record<string, ItemOrden[]>; // esta sí es síncrona: solo agrupa

// lo que dispara reportarGoogleSheets al aprobar
type OrdenAprobada = { orden: Orden; total: number; proveedores: number; fecha: string };
```
Store global en Zustand (`useOrdenStore`): `orden`, `presupuesto`, `eventosPasados`. Todos
leen/escriben de aquí una vez integrado.

## Persona 1 — Base de la app y UI
**Dueña de:** `types.ts`, `useOrdenStore`, UI de la orden y el presupuesto.

**Entregable inmediato (min 10–25):** `types.ts` publicado con el contrato de arriba +
scaffold Next.js corriendo (`npx create-next-app`, App Router + TypeScript).
**Qué ir haciendo después:** `useOrdenStore` real (Zustand); UI de "Orden actual" donde
cada ítem muestra nombre, precio, proveedor y link de origen (ya no hay catálogo
navegable — los productos entran a la orden a medida que el agente los encuentra);
indicador de presupuesto (gastado / total / delta).
**Herramienta:** Next.js (App Router) + TypeScript, Zustand.
**Cómo no bloquea a nadie:** publica `types.ts` de inmediato; el store real llega en el
sync de min 45, hasta entonces las otras 3 personas usan un store-mock propio.
**Después del min 45:** queda libre para pair-programming — destraba a quien se atore
integrando con el store real.

## Persona 2 — Plomería de CopilotKit
**Dueña de:** provider, sidebar, runtime, `useCopilotReadable`.

**Entregable inmediato (min 10–45):** `<CopilotKit>` + `<CopilotSidebar>` + API route
`/api/copilotkit` con `CopilotRuntime`, conversando con el LLM sobre un `useOrdenStore`
de mentira que ella misma escribe (2-3 ítems fijos, cumpliendo el contrato) — prueba de
humo: el agente describe ese estado falso en el sidebar sin que se lo peguen.
**Qué ir haciendo después:** `useCopilotReadable` real (orden en curso, presupuesto);
afinar el prompt del sistema del runtime.
**Herramienta:** `@copilotkit/react-core`, `@copilotkit/react-ui`, `CopilotRuntime`, SDK de
OpenAI u OpenRouter.
**Sync min 45:** cambia el import del store-mock por el real de la Persona 1.

## Persona 3 — Lógica agéntica (el corazón de la demo)
**Dueña de:** las 4 acciones (envueltas en `useCopilotAction`) y el gate de aprobación.
Consume `lib/exa/buscarProductos.ts` — no lo reimplementa, ya está listo.

**Entregable inmediato (min 10–45):** `armarCanastaDesdeMeta` funcionando SOLA — sin
store, sin sidebar, sin nadie más — probada con un `MetaEvento` inventado a mano,
llamando de verdad a Exa (la key ya está puesta) y devolviendo una `Orden`.
**Qué ir haciendo después, en orden:** `validarYOptimizarPresupuesto` (vuelve a llamar
`buscarProductos` por opciones más baratas si se excede) → `detectarEsencialesFaltantes`
(busca en Exa el ítem obvio olvidado y lo entrega listo para agregar) →
`consolidarPorProveedor` (agrupa `orden.items` por `producto.proveedor`, síncrona). Luego
la acción de emitir con `renderAndWaitForResponse` (Aprobar/Editar/Cancelar) + tarjeta-
resumen (generative UI) + traza breve de qué decidió y por qué.
**Herramienta:** TypeScript + `lib/exa/buscarProductos.ts` (ya construido) +
`useCopilotAction` / `renderAndWaitForResponse` de CopilotKit.
**Sync min 45:** envuelve sus 4 funciones en `useCopilotAction`, conectadas al store real
de Persona 1 y al runtime de Persona 2.
**Sync min 90:** reemplaza su `MetaEvento` de prueba por el que entrega de verdad el
webhook de WhatsApp de la Persona 4.

## Persona 4 — Entrada por WhatsApp, integraciones post-aprobación + demo
**Dueña de:** el disparador (`recibirMensajeWhatsApp`), el reporte
(`reportarGoogleSheets`), la caché de respaldo de Exa, y que la demo salga bien.

**Entregable inmediato (min 10–45):** Evolution API corriendo en Docker con un número de
prueba vinculado por QR; webhook recibiendo un mensaje simulado con `curl` y
transformándolo en un `MetaEvento` — nada de esto depende de que la app exista.
**Qué ir haciendo después:**
- `reportarGoogleSheets`: service account de Google, función que recibe un
  `OrdenAprobada` de prueba (inventado a mano) y agrega una fila (fecha, ítems, total,
  proveedores) — tampoco necesita esperar una orden real.
- **Caché de respaldo de Exa:** coordinar con Persona 3 las consultas exactas que usará
  el guion de demo, correrlas una vez contra Exa y guardar los resultados en un JSON de
  respaldo, para no depender de la latencia/disponibilidad de Exa en el momento crítico.
- `enriquecerConExa` ya NO aplica como tarea aparte (Exa es el catálogo, no un extra).
**Herramienta:** Evolution API (Docker, protocolo WhatsApp Web/Baileys), Google Sheets API
+ service account (`googleapis` npm), `curl` para probar el webhook en aislado.
**Sync min 90:** conecta el webhook real a la Persona 3 (que deja de usar su `MetaEvento`
de prueba) y `reportarGoogleSheets` al evento real de aprobación.
**Después del min 90:** ensaya el guion de demo; graba el video de respaldo con la corrida
perfecta **antes de las 3:30**; README de 1 párrafo (problema, solución, rol de
CopilotKit).

## Cronograma con puntos de sincronización (no una cadena de entregas)
1. **0–10 min:** las 4 personas acuerdan el contrato de tipos juntas.
2. **10–45 min:** las 4 construyen EN PARALELO — cada quien contra el contrato, con mocks
   de lo que aún no existe (store falso, `MetaEvento` inventado, `OrdenAprobada`
   inventado). Nadie espera a nadie en este bloque.
3. **Sync min 45 (10-15 min):** Persona 1 publica el store y la UI reales; Personas 2 y 3
   cambian sus mocks por las piezas reales. Persona 4 sigue en lo suyo, no participa de
   este sync.
4. **45–90 min:** integración del store real + refinamiento de las 4 acciones y el gate de
   aprobación. Persona 4 sigue con su webhook, Sheets y la caché de respaldo de Exa, en
   paralelo, sin bloquear ni bloquearse.
5. **Sync min 90 (10-15 min):** se conecta el webhook de WhatsApp (Persona 4) al pipeline
   del agente (Persona 3), y `reportarGoogleSheets` al evento real de aprobación.
6. **90 min–2h30:** flujo end-to-end funcionando; fixes; `repetirEventoPasado` si sobra
   tiempo.
7. **2h30–3h30:** ensayo del guion completo con la caché de respaldo lista, pulido.
8. **3h30–4h:** grabación del video de respaldo + README final.
