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
estima cantidades, cruza contra el catálogo, respeta el presupuesto, detecta esenciales
olvidados y consolida por proveedor. El agente vive en la barra lateral de la app, "ve" el
catálogo y el presupuesto que están en pantalla, y ejecuta acciones dentro de la app pidiendo
confirmación humana antes de emitir la orden.

Por qué gana:
- Encaje con el tema: el agente aparece donde ya ocurre el trabajo y es más útil porque lee
  el estado en pantalla (catálogo + presupuesto), no porque le copien/peguen datos.
- Demo a prueba de fallos: la app, el catálogo y el presupuesto son NUESTROS (datos sembrados),
  sin depender de proveedores/marketplaces externos que cambien de DOM, nos bloqueen o se caigan.
- Agéntico de verdad: descomposición de una meta en un plan multi-paso que muta el estado,
  con human-in-the-loop.

## REGLA NO NEGOCIABLE
El catálogo de productos, precios, stock y el presupuesto son datos sembrados DENTRO de la app
(seed.json local). Prohibido consultar precios/stock reales de terceros en la ruta crítica de
la demo. Esto es lo que garantiza que la demo corra siempre igual.

## Alcance REALISTA (< 4 horas) — no exceder
MUST (esto es el proyecto, en este orden):
1. App Next.js de UNA sola página: catálogo de productos (tarjetas/tabla) + un panel de
   "Orden actual" (carrito) + un indicador de presupuesto. Todo desde seed.json.
2. Integrar CopilotKit: provider <CopilotKit> + <CopilotSidebar> + CopilotRuntime en una API route.
3. Exponer el contexto de pantalla con useCopilotReadable: el catálogo visible, el filtro
   actual, la orden en curso y el presupuesto. ESTE es el corazón del tema.
4. 4 acciones con useCopilotAction que MODIFIQUEN el estado en vivo (orden en este orden):
   a) armarCanastaDesdeMeta: recibe {tipoEvento, numPersonas, presupuesto, fecha}, estima
      cantidades por ítem según tamaño del evento y llena la orden desde el catálogo.
   b) validarYOptimizarPresupuesto: si la orden se pasa del presupuesto, propone sustituciones
      más baratas o ajusta cantidades, y muestra el delta (antes/después).
   c) detectarEsencialesFaltantes: dada la orden, señala ítems obvios olvidados para ese tipo
      y tamaño de evento (p.ej. "para 150 personas faltan vasos y bolsas de basura"). ← golpe
      de "me salvó de un olvido".
   d) consolidarPorProveedor: agrupa la orden por proveedor para reducir envíos/tiempos.
5. Human-in-the-loop en la acción de EMITIR la orden: usar renderAndWaitForResponse para
   mostrar "Voy a emitir esta orden: N ítems, total S/X, M proveedores, entrega [fecha]
   — [Aprobar] [Editar] [Cancelar]" y solo ejecutar tras aprobación. Al aprobar, mostrar una
   tarjeta-resumen (generative UI de CopilotKit) con total, proveedores y fecha. ← momento estrella.

DECIDIDO — post-aprobación (fuera de la ruta crítica, no bloquea la demo si falla):
- notificarWhatsApp: al aprobar la orden, envía el resumen (ítems, total, proveedores, fecha)
  por WhatsApp usando Evolution API (self-hosted vía Docker, protocolo WhatsApp Web/Baileys,
  vinculado por QR a un número de prueba). Bajo volumen (1–2 mensajes por demo) para minimizar
  riesgo de baneo. Si la sesión se cae, la demo sigue sin este paso.
- reportarGoogleSheets: al aprobar la orden, agrega una fila (fecha, ítems, total, proveedores)
  a una hoja de Google Sheets vía service account (sin OAuth interactivo) como "reporte de
  resultado".

NICE (solo si sobra tiempo, en este orden):
- repetirEventoPasado: "arma lo mismo que la activación de marzo pero para 200" — leer un
  pedido histórico del seed y reescalarlo. Muy agéntico, cero fricción.
- Enriquecer UNA acción con búsqueda web (sponsor Exa) como referencia de precio externo de un
  solo ítem. Nunca en la ruta crítica de la demo.
- Input por voz con Web Speech API (suma "superficie inesperada").

NO hacer (fuera de alcance / rompe la demo):
- Scraping o APIs reales de proveedores/marketplaces. Login/OAuth reales. Multi-página.
  Backend pesado. Base de datos. Checkout/pagos reales. Logística/inventario completo
  (elegimos SOLO la historia de compra para evento; nada más).

## Stack
- Next.js (App Router) + TypeScript.
- CopilotKit: @copilotkit/react-core, @copilotkit/react-ui; CopilotRuntime en una API route.
- LLM vía OpenAI o OpenRouter (sponsors). Modelo rápido y barato.
- Estado en React (useState) o Zustand. Persistencia opcional: localStorage. Sin base de datos.
- WhatsApp: Evolution API (self-hosted, Docker) — notificación post-aprobación, no crítica.
- Reporte: Google Sheets API (service account) — fila por orden emitida, post-aprobación, no crítica.

## Datos sembrados (seed.json) — construir PARA que la demo luzca
- Catálogo de ~20–30 productos con: id, nombre, categoría (bebidas, snacks, mobiliario,
  desechables, decoración, limpieza), precioUnit, proveedor, stock, unidadesPorPaquete.
- Al menos 3–4 proveedores distintos para que consolidarPorProveedor tenga efecto visible.
- Plantar a propósito: (1) que la primera canasta se pase ligeramente del presupuesto para
  que validarYOptimizar tenga qué hacer; (2) que falten 2 esenciales evidentes (p.ej. vasos,
  bolsas de basura) para que detectarEsencialesFaltantes brille.
- 1–2 "eventos pasados" guardados para la acción NICE de repetir.

## Comportamiento agéntico requerido
- El agente SIEMPRE razona sobre el estado expuesto por useCopilotReadable; no pide datos que
  ya están en pantalla.
- Toda acción que muta la orden actualiza la UI al instante.
- La emisión de la orden pasa por confirmación humana.
- Dejar visible una traza breve de qué decidió y por qué (cantidades estimadas, sustituciones,
  faltantes), para que el human-in-the-loop se vea genuino.

## Guion de demo (60–90 s) — la app se construye PARA que esto salga perfecto
1. Se ve el catálogo y el presupuesto en S/ 8,000, orden vacía.
2. El presentador escribe: "Equipar una activación de marca para 150 personas, presupuesto
   S/ 8,000, entrega el viernes."
3. El agente arma la canasta leyendo el catálogo visible → la orden se llena en vivo.
4. Avisa que se pasó del presupuesto y propone sustituciones → muestra el delta y ajusta.
5. Detecta faltantes: "para 150 personas te faltan vasos y bolsas de basura" → los agrega.
6. Consolida por proveedor y ofrece emitir → aparece el paso de aprobación → el presentador
   aprueba → tarjeta-resumen final con total, proveedores y fecha.
7. Cierre (1 frase): "De armar la canasta ítem por ítem y cuadrar presupuesto en otra hoja,
   a describir el evento en una frase y aprobar la orden en 15 segundos."

## Definición de "listo"
- La demo del guion corre de principio a fin sin tocar nada externo.
- Grabar un video de respaldo con la corrida perfecta ANTES de las 3:30.
- README de 1 párrafo con el problema, la solución y el rol de CopilotKit (para el portal).