# BRIEF DE PROYECTO — Hackathon "Agents, Everywhere" (AI Tinkerers · Lima)

## Contexto
Sprint de ~4 horas de build. Se evalúa por lo que subimos al portal (demo/video corto + descripción).
Tema: "Los agentes salen del chatbox. Construye un agente para un lugar donde la gente ya
trabaja, y hazlo más útil gracias a ESE contexto. ¿Qué se vuelve posible cuando el agente
aparece justo donde ya ocurre el trabajo?"
Meta: ganar por confiabilidad de demo + encaje con el tema + profundidad agéntica real,
apalancando el sponsor CopilotKit.

## Concepto
Copiloto agéntico de compras por lote, incrustado en la propia consola de compras de una
empresa. Un encargado de compras describe un evento en UNA frase ("activación de marca para
150 personas, presupuesto S/ 8,000, entrega el viernes") y el agente arma la orden completa:
busca productos reales, estima cantidades, respeta el presupuesto, detecta esenciales
olvidados y consolida por proveedor. El agente vive en la barra lateral de la app, "ve" la
orden y el presupuesto que están en pantalla, y ejecuta acciones dentro de la app pidiendo
confirmación humana antes de emitir la orden.

Por qué gana:
- Encaje con el tema: el agente aparece donde ya ocurre el trabajo y es más útil porque lee
  el estado en pantalla (orden + presupuesto), no porque le copien/peguen datos.
- Agéntico de verdad: descomposición de una meta en un plan multi-paso que muta el estado,
  con human-in-the-loop.
- Profundidad real de búsqueda: los productos y precios vienen de Exa buscando en vivo en la
  web (proveedores reales del Perú), no de una lista inventada.

## REGLA (actualizada — ya NO es "todo sembrado")
El presupuesto y los eventos pasados siguen siendo datos sembrados (seed.json local). El
CATÁLOGO de productos YA NO es sembrado: se reemplazó por búsquedas en vivo a la API de Exa
(ver `lib/exa/buscarProductos.ts`). Esto es una decisión explícita del equipo, tomada sabiendo
que introduce una dependencia externa en la ruta crítica de la demo (la regla original de "cero
terceros" queda derogada solo para el catálogo). Mitigación recomendada: correr las búsquedas
exactas del guion de demo ANTES del show y guardar esos resultados como caché de respaldo, para
no depender de la latencia/disponibilidad de Exa justo en el momento crítico.

## Alcance REALISTA (< 4 horas) — no exceder
MUST (esto es el proyecto, en este orden):
1. App Next.js de UNA sola página: un panel de "Orden actual" (carrito) + un indicador de
   presupuesto. Ya no hay catálogo pre-cargado desde seed.json — los productos aparecen en
   la orden a medida que el agente los busca y los agrega (con su nombre, precio, proveedor
   y link de origen visibles).
2. Integrar CopilotKit: provider <CopilotKit> + <CopilotSidebar> + CopilotRuntime en una API route.
3. Exponer el contexto de pantalla con useCopilotReadable: el filtro actual, la orden en
   curso y el presupuesto. ESTE es el corazón del tema.
4. 4 acciones con useCopilotAction que MODIFIQUEN el estado en vivo (orden en este orden):
   a) armarCanastaDesdeMeta: recibe {tipoEvento, numPersonas, presupuesto, fecha}, decide qué
      ítems hacen falta, busca cada uno en vivo con `buscarProductos` (Exa) y llena la orden
      con lo que encuentra.
   b) validarYOptimizarPresupuesto: si la orden se pasa del presupuesto, vuelve a buscar con
      `buscarProductos` opciones más baratas del mismo ítem o ajusta cantidades, y muestra el
      delta (antes/después).
   c) detectarEsencialesFaltantes: dada la orden, señala ítems obvios olvidados para ese tipo
      y tamaño de evento (p.ej. "para 150 personas faltan vasos y bolsas de basura"). ← golpe
      de "me salvó de un olvido".
   d) consolidarPorProveedor: agrupa la orden por proveedor para reducir envíos/tiempos.
5. Human-in-the-loop en la acción de EMITIR la orden: usar renderAndWaitForResponse para
   mostrar "Voy a emitir esta orden: N ítems, total S/X, M proveedores, entrega [fecha]
   — [Aprobar] [Editar] [Cancelar]" y solo ejecutar tras aprobación. Al aprobar, mostrar una
   tarjeta-resumen (generative UI de CopilotKit) con total, proveedores y fecha. ← momento estrella.

DECIDIDO — entrada del flujo (disparador, vía WhatsApp):
- recibirMensajeWhatsApp: el encargado de compras envía la frase del evento por WhatsApp;
  Evolution API (self-hosted vía Docker, protocolo WhatsApp Web/Baileys, vinculado por QR a
  un número de prueba) recibe el mensaje y se lo entrega al agente como si lo hubiera escrito
  en el sidebar de la app. Es el disparador de TODO el flujo, no un paso posterior.
  Para la demo en vivo, preferir tener el mensaje ya recibido (o enviarlo justo antes) para no
  depender de la estabilidad de la sesión en el momento crítico; escribir directo en el sidebar
  queda como fallback si la sesión de WhatsApp falla.

DECIDIDO — post-aprobación (fuera de la ruta crítica, no bloquea la demo si falla):
- reportarGoogleSheets: al aprobar la orden, agrega una fila (fecha, ítems, total, proveedores)
  a una hoja de Google Sheets vía service account (sin OAuth interactivo) como "reporte de
  resultado".

Nota: `enriquecerConExa` como acción NICE separada queda absorbida — Exa ya no es un
"enriquecimiento opcional", es la fuente del catálogo completo (ver MUST #1 y #4a/b).

NICE (solo si sobra tiempo, en este orden):
- repetirEventoPasado: "arma lo mismo que la activación de marzo pero para 200" — leer un
  pedido histórico del seed y reescalarlo. Muy agéntico, cero fricción.
- Input por voz con Web Speech API (suma "superficie inesperada").

NO hacer (fuera de alcance / rompe la demo):
- Scraping de proveedores/marketplaces (Exa vía su API oficial es la única excepción,
  cubierta en MUST #1). Login/OAuth reales. Multi-página. Backend pesado. Base de datos.
  Checkout/pagos reales. Logística/inventario completo (elegimos SOLO la historia de
  compra para evento; nada más).

## Stack
- Next.js (App Router) + TypeScript.
- CopilotKit: @copilotkit/react-core, @copilotkit/react-ui; CopilotRuntime en una API route.
- LLM vía OpenAI o OpenRouter (sponsors). Modelo rápido y barato.
- Estado en React (useState) o Zustand. Persistencia opcional: localStorage. Sin base de datos.
- WhatsApp: Evolution API (self-hosted, Docker) — disparador de entrada del flujo (webhook).
- Reporte: Google Sheets API (service account) — fila por orden emitida, post-aprobación, no crítica.
- Catálogo: Exa API (`exa-js`) vía `lib/exa/buscarProductos.ts` — búsqueda en vivo con
  `outputSchema` (nombre, precioAprox, proveedor, url) y `systemPrompt` pidiendo productos
  reales del Perú con precio verificable. YA IMPLEMENTADO Y PROBADO (ver abajo). Key en
  `.env.local` como `EXA_API_KEY` (gitignored).

## Búsqueda de productos con Exa — reemplaza seed.json de catálogo
- `lib/exa/buscarProductos.ts` expone `buscarProductos(consulta, { numResults? })`, que
  llama a `POST /search` de Exa con `type: "auto"` y devuelve `ProductoBuscado[]`
  (`nombre`, `proveedor`, `precioAprox`, `url`). Probado en vivo: para "vasos descartables
  para eventos por mayor, precio en soles, Lima Peru" devuelve proveedores reales (Eco Yura
  Perú, Prolider, Plaza Multipack) con precios reales en soles y su URL de origen.
- Cada acción arma su propia consulta en español por ítem/categoría necesaria (p.ej. "sillas
  en alquiler para eventos, precio por unidad, Lima Perú") y llama a `buscarProductos`.
- Ya no hay `stock` ni `unidadesPorPaquete` garantizados como campos: cuando la página los
  expone quedan implícitos en `nombre` (p.ej. "paquete x 50 unidades"); no asumir que
  siempre están.
- **Mitigación de riesgo para la demo:** correr de antemano las consultas exactas del guion
  y guardar esos resultados como caché de respaldo, para no depender de la latencia o
  disponibilidad de Exa en el momento crítico.

## Datos sembrados (seed.json) — solo lo que NO viene de Exa
- Presupuesto por defecto (S/ 8,000).
- 1–2 "eventos pasados" guardados para la acción NICE de repetir — guardar el snapshot
  completo de cada ítem (nombre, proveedor, precioAprox, url), no un id de catálogo que ya
  no existe.
- El catálogo de productos YA NO se siembra aquí (ver sección de Exa arriba).

## Comportamiento agéntico requerido
- El agente SIEMPRE razona sobre el estado expuesto por useCopilotReadable; no pide datos que
  ya están en pantalla.
- Toda acción que muta la orden actualiza la UI al instante.
- La emisión de la orden pasa por confirmación humana.
- Dejar visible una traza breve de qué decidió y por qué (cantidades estimadas, sustituciones,
  faltantes), para que el human-in-the-loop se vea genuino.

## Guion de demo (60–90 s) — la app se construye PARA que esto salga perfecto
1. Se ve la app con el presupuesto en S/ 8,000 y la orden vacía.
2. El presentador envía por WhatsApp (o escribe en el sidebar como fallback): "Equipar una
   activación de marca para 150 personas, presupuesto S/ 8,000, entrega el viernes."
3. El agente busca cada ítem en vivo con Exa → la orden se llena con productos reales
   (nombre, precio, proveedor, link) a medida que los encuentra.
4. Avisa que se pasó del presupuesto y busca opciones más baratas → muestra el delta y ajusta.
5. Detecta faltantes: "para 150 personas te faltan vasos y bolsas de basura" → los agrega.
6. Consolida por proveedor y ofrece emitir → aparece el paso de aprobación → el presentador
   aprueba → tarjeta-resumen final con total, proveedores y fecha.
7. Cierre (1 frase): "De armar la canasta ítem por ítem y cuadrar presupuesto en otra hoja,
   a describir el evento en una frase y aprobar la orden en 15 segundos."

## Definición de "listo"
- La demo del guion corre de principio a fin (Exa es la única dependencia externa en la ruta
  crítica, con caché de respaldo lista por si falla en el momento).
- Grabar un video de respaldo con la corrida perfecta ANTES de las 3:30.
- README de 1 párrafo con el problema, la solución y el rol de CopilotKit (para el portal).