# Outbox — Project Documentation

## 1. Overview

Outbox is an AI-assisted bulk purchasing copilot for event procurement teams. Instead of manually searching supplier websites, estimating quantities, comparing prices, and assembling an order in a spreadsheet, a buyer describes the event in natural language.

For example:

> "Brand activation for 150 people, budget S/ 8,000, delivery on Friday."

The copilot can use the visible order and budget context, search for real products in Peru, and build a purchase order. The buyer remains in control of the final decision.

## 2. Problem We Solve

Event purchasing is repetitive and fragmented. A buyer normally has to:

1. Decide what supplies an event needs.
2. Search multiple suppliers.
3. Estimate quantities and package sizes.
4. Keep the order inside budget.
5. Avoid forgetting essential items.
6. Coordinate products across suppliers.

Outbox moves that work into the purchasing workspace itself. The agent is more useful because it can read the order, budget, item quantities, and suppliers already visible on screen.

## 3. User Flow

### Create an order

The buyer provides four pieces of information:

- Event type
- Number of people
- Budget in Peruvian soles
- Delivery date

The agent uses this information to search for required items and populate the order.

### Review the order

The interface groups products into purchase-oriented categories:

- Beverages
- Food and catering
- Furniture
- Disposables and service
- Cleaning and waste
- Decoration and activation
- Equipment and logistics
- Other

Every category displays its item count, supplier count, and subtotal. Each line item shows its supplier, unit price, source link, quantity controls, and alternatives when available.

### Adjust an order

The buyer can ask for additions or alternatives, for example:

> "Add balloons and 20 garbage bags to the current order."

The intended behavior is to preserve existing items and add the requested products. A new order should only replace the current one when the buyer explicitly asks to start over.

### Package-aware quantities

Outbox recognizes common presentation formats such as `pack x50`. If an event needs 150 cups and the selected product contains 50 cups per pack, the order uses three packs instead of 150 packs.

## 4. Architecture

```text
Buyer message in Copilot sidebar
        │
        ▼
CopilotKit + OpenRouter LLM
        │ decides which client action to use
        ▼
React client actions and Zustand order store
        │
        ▼
Next.js API route: /api/buscar-productos
        │ keeps API key on the server
        ▼
Exa Search API
        │
        ▼
Normalized products: name, supplier, price, URL, category, package size
```

## 5. Technologies

### Next.js 16 and TypeScript

Next.js provides the single-page application and server-side API routes. TypeScript defines the shared contracts used by the UI, state store, Exa integration, and agent actions.

Important files:

- `app/page.tsx`: purchasing dashboard and Copilot actions.
- `app/api/buscar-productos/route.ts`: server endpoint for product search.
- `app/api/copilotkit/route.ts`: CopilotKit runtime endpoint.
- `types.ts`: shared purchase-order data types.

### React and Zustand

React renders the interactive dashboard. Zustand manages the current purchase order in `store/useOrdenStore.ts`.

The store keeps:

- Current items
- Budget
- Previous event snapshots
- Total and remaining budget calculations
- Unique suppliers
- Actions to add, replace, update, or remove items

### CopilotKit

CopilotKit embeds the AI sidebar in the existing purchasing interface.

It is used to:

- Show the conversation UI through `CopilotSidebar`.
- Give the agent live screen context through `useCopilotReadable`.
- Expose UI-changing actions through `useCopilotAction`.

Current client actions include:

- `armarCanastaDesdeMeta`: creates a basket from an event goal.
- `ajustarOrden`: searches for requested additions and adds them to the current order.

### OpenRouter

OpenRouter supplies the language model used by CopilotKit. The project uses the OpenAI-compatible SDK with OpenRouter's base URL.

Required environment variables:

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=your_tool_calling_model_here
```

For reliable agent actions, use a fixed model that supports tool calling. `openrouter/free` is useful for experimentation but routes requests to variable free models, which can be less reliable for multi-step tool flows.

### Exa Search API

Exa is the live product discovery layer. It replaces a static product catalog with current web search results from Peruvian suppliers.

`lib/exa/buscarProductos.ts` sends focused Spanish queries to Exa and normalizes each result into:

```ts
type ProductoBuscado = {
  nombre: string;
  proveedor: string;
  precioAprox: number;
  url: string;
  tipoEnlace?: "ficha" | "catalogo" | "sin_verificar";
  unidadesPorPresentacion?: number;
  categoria?: string;
};
```

The integration asks Exa to return real products with verified prices in Peruvian soles. It also asks for exact product pages rather than supplier home pages or category pages.

The application classifies links conservatively:

- `ficha`: the URL looks like a direct product page.
- `catalogo`: the URL is clearly a category or catalog page.
- `sin_verificar`: the URL is not clearly identifiable from its path alone.

Catalog links are not automatically selected when a more specific result is available.

### Local Classification Helpers

Two shared helper modules improve reliability without requiring another external service:

- `lib/producto.ts`: classifies source URLs and calculates quantities from package sizes.
- `lib/categorias.ts`: assigns products to functional purchase categories from their names and suppliers.

## 6. Setup

### Requirements

- Node.js
- An Exa API key
- An OpenRouter API key

### Environment file

Create `.env.local` in the project root:

```env
EXA_API_KEY=your_exa_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=your_selected_model_here
```

Never commit `.env.local`.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 7. Current Status

Implemented:

- Purchase order UI and budget indicator
- Zustand order state
- Live Exa product search through a protected server route
- Product alternatives
- Product-link classification
- Package-aware quantities
- Category-based order grouping
- CopilotKit sidebar and client actions

Planned improvements:

- A stable fixed tool-calling model and stronger CopilotKit tool rendering
- Explicit rules for adding to an existing order versus replacing it
- Budget optimization with before/after savings
- Missing-essential detection
- Supplier consolidation
- Human approval before order issuance
- Exa response cache for a reliable live demo fallback

## 8. Security Notes

- API keys stay in `.env.local` and are never sent to the browser.
- Exa is accessed only through server-side code and a Next.js API route.
- Product URLs are displayed as sources, but their classification makes uncertainty visible instead of presenting catalog pages as exact product pages.
- The buyer should approve the final order before any real-world order is issued.
