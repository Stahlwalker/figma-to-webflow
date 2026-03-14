# Figma to Webflow

A Webflow Hybrid App that imports Figma designs directly into the Webflow Designer. Paste a Figma URL, select sections, and build them as styled Webflow elements — no copy-paste or manual recreation needed.

## How It Works

1. **Paste a Figma URL** — the app reads the design via Figma's REST API
2. **Review sections** — auto-detected sections are shown with preview images
3. **Check fonts** — see which fonts the design uses so you can install them in Webflow
4. **Build** — each section is created as real Webflow elements with styles applied directly in the Designer

The translation is fully deterministic (no AI/LLM) — Figma's auto-layout, fills, typography, and effects are mapped to CSS properties and applied via Webflow's Designer API.

## Architecture

```
Webflow Designer (browser)
┌─────────────────────────────────────┐
│  Designer Extension (Vite + React)  │
│  - 4-step wizard UI                │
│  - Creates elements via Designer API│
│  - Applies styles via Designer API  │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│  Data Client (Next.js backend)      │
│  - Figma REST API (read designs)    │
│  - Deterministic mapper             │
│  - Webflow Data API (list sites)    │
│  - OAuth for Webflow                │
└─────────────────────────────────────┘
```

## Project Structure

```
figma-to-webflow/
├── data-client/                  # Next.js backend
│   ├── app/api/
│   │   ├── auth/                 # OAuth flows (Figma, Webflow)
│   │   ├── figma/                # Figma REST API proxy (file, fonts)
│   │   ├── mapper/               # Build plan generation
│   │   └── webflow/              # Webflow Data API (sites)
│   └── lib/
│       ├── figma/                # Figma client, parser, fonts
│       └── mapper/               # Figma node → CSS mapper
│
├── designer-extension/           # Vite + React (runs in Webflow Designer)
│   ├── src/
│   │   ├── steps/                # Setup, Sections, Fonts, Build steps
│   │   ├── builder/              # Element + style creation via Designer API
│   │   └── services/             # HTTP client to backend
│   └── webflow.json              # Webflow extension config
│
└── package.json                  # npm workspaces root
```

## Setup

### Prerequisites

- Node.js 18+
- A [Webflow App](https://developers.webflow.com/) registered with Data Client + Designer Extension
- A [Figma personal access token](https://www.figma.com/developers/api#access-tokens)
- [ngrok](https://ngrok.com/) for HTTPS tunneling in development

### Environment Variables

**data-client/.env.local**
```
FIGMA_CLIENT_ID=...
FIGMA_CLIENT_SECRET=...
WEBFLOW_CLIENT_ID=...
WEBFLOW_CLIENT_SECRET=...
```

**designer-extension/.env**
```
VITE_API_URL=https://your-ngrok-url.ngrok-free.dev
```

### Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the backend
cd data-client
npm run dev

# 3. Tunnel backend via ngrok
ngrok http 3000

# 4. Build the designer extension
cd designer-extension
npm run build

# 5. Serve the extension (injects Webflow Designer API)
npx webflow extension serve 5173

# 6. Open Webflow Designer → Apps panel → launch the extension
```

**Important:** The designer extension must be served with `webflow extension serve`, not the Vite dev server. This is how the Webflow Designer API gets injected into the extension iframe.

## Mapper Coverage

The deterministic mapper currently translates:

- **Auto-layout** → `display: flex`, `flex-direction`, `gap`, `padding`, `align-items`, `justify-content`
- **Solid fills** → `background-color` (rgba)
- **Typography** → `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `color`, `text-align`
- **Geometry** → `width`, `height`, `border-radius`, `opacity`, `overflow`
- **Effects** → `box-shadow` (drop shadows)

### Not yet supported

- Gradients and image fills
- Strokes / borders
- Inner shadows and blur effects
- Constraints → responsive layout
- Component instances → Webflow components
