# Current Status — March 14, 2026

## Where We Left Off

The end-to-end flow works. You can paste a Figma URL, detect sections, and build them in the Webflow Designer. The first successful build was the **Announcement Bar** — it created 7 elements with the correct blue background color and nested div structure. But text content (e.g., "The full Webflow Conf 2025 agenda is here!") did not appear, and all elements are generic divs instead of semantic HTML.

**This is the starting point for the next session: fix text rendering and use correct element presets.**

## Resuming on Monday

### 1. Start the services

```bash
# Terminal 1: Backend
cd data-client && npm run dev

# Terminal 2: ngrok tunnel
ngrok http 3000

# Terminal 3: Build + serve extension
cd designer-extension
# Update .env with the new ngrok URL first!
npm run build
npx webflow extension serve 5173
```

### 2. Update the ngrok URL

Every time ngrok restarts, the URL changes. Update `designer-extension/.env`:
```
VITE_API_URL=https://<new-ngrok-subdomain>.ngrok-free.dev
```
Then rebuild: `npm run build`

### 3. Figma token

The current personal access token (`figd_scg...`) likely expires March 15. You'll need to generate a new one:
- Go to https://www.figma.com/developers/api#access-tokens
- Or: Figma → Settings → Personal access tokens → Generate new token
- Scopes needed: `file_content:read`, `file_metadata:read`
- Paste it into the extension's Setup step (it stores in localStorage)

### 4. Open in Webflow Designer

Open the Webflow Designer → Apps panel → launch the Figma to Webflow extension.

## Figma Auth: OAuth vs Personal Access Token

### Current approach: Personal access token (PAT) — dev workaround only
- User pastes a `figd_...` token into a text field in the extension UI
- Token is stored in the browser's localStorage
- Backend sends it as `X-Figma-Token` header
- **This is NOT acceptable for end users** — they should never need to generate a developer token

### Why OAuth isn't working yet
The OAuth flow is fully implemented and works (redirect, token exchange, `figu_` token returned). But **the Webflow org's Figma admin settings block third-party OAuth apps** from accessing files. Even files in personal workspaces returned 403 with the OAuth token.

The OAuth code is still in the codebase (`data-client/app/api/auth/figma/`) — it just needs the org restriction lifted.

### Path to production: OAuth must work
For end users, OAuth is the only acceptable auth method. Options to unblock:

1. **Get the Figma org admin to allowlist the OAuth app** — this is the correct fix. The Figma admin panel has settings to approve third-party integrations.
2. **Test with a personal (non-org) Figma account** — personal accounts don't have org restrictions. Register a separate Figma account to validate the OAuth flow end-to-end, then pursue option 1.
3. **Register as an official Figma integration** — may bypass org restrictions once approved.

### For development in the meantime
- Use a personal access token with **"No expiration"** set
- The PAT input UI in SetupStep.tsx is a dev convenience, not a production feature
- When OAuth is unblocked: revert SetupStep.tsx to the OAuth popup flow and switch `data-client/lib/figma/client.ts` back to `Authorization: Bearer` header

## What's Working

1. **Figma auth** — personal access token input
2. **Webflow auth** — OAuth popup flow
3. **Read Figma design** — paste a Figma URL, auto-detect sections (Announcement Bar, Navigation, Hero, etc.)
4. **Font extraction** — lists fonts used in the design
5. **Build sections** — creates Webflow elements with styles in the Designer canvas

### What built vs. what's in Figma

**Figma (original):**
- Blue announcement bar with white text: "The full Webflow Conf 2025 agenda is here! Join us online on September 17-18."
- "Register Now →" link on the right
- Flexbox row layout with space-between alignment

**Webflow (built):**
- Blue bar with correct background color and layout structure
- Text content is NOT appearing (known issue #1)
- All 7 elements created as nested divs (known issue #2)

## Known Issues

### 1. Text content not rendering — P0
**Location:** `designer-extension/src/builder/element-creator.ts:77`

Text is only set on leaf nodes (elements with zero children), and all elements are created as `DivBlock` presets. The combination means text either doesn't get set, or DivBlocks don't render it correctly.

**Root cause:** Two things need to change:
- Use `Paragraph` or `Heading` presets for text nodes instead of `DivBlock`
- Verify `node.characters` from Figma API is actually in the build plan (check `data-client/lib/mapper/index.ts:57`)

### 2. All elements are DivBlocks — P1
**Location:** `designer-extension/src/builder/element-creator.ts:37`

The mapper correctly generates presets (`Section`, `DivBlock`, `Heading`, `Paragraph`) in `plan.preset`, but the builder hardcodes `wf.elementPresets.DivBlock` for everything. Need to map `plan.preset` to `wf.elementPresets[plan.preset]`.

**Caveat:** Not all presets support `append()` for children. Text presets (Paragraph, Heading) become text-only elements. Need to test which presets support children and handle accordingly.

### 3. `elementBuilder` API doesn't work — Parking for now
We couldn't get `webflow.elementBuilder(webflow.elementPresets.DOM)` to work — always throws "Invalid element preset". The one-at-a-time `element.append(preset)` approach works. This might be a Webflow API version issue or a bug. If needed later for performance (bulk insert), revisit.

### 4. Duplicate styles from previous builds — Fixed
Style creator now pre-loads existing styles and reuses them. Handled in `style-creator.ts`.

### 5. Elements that can't have children — Fixed
Check `typeof parent.append === "function"` before recursing. Child creation wrapped in try-catch so one failure doesn't kill the whole build.

## Dev Workflow

```bash
# Edit code → build → restart → refresh
cd designer-extension
npm run build
pkill -f "webflow extension serve"
npx webflow extension serve 5173
# Then click refresh icon in the Webflow Designer extension panel
```

**Why not hot reload?** `webflow extension serve` is what injects the Designer API into the iframe. Vite's dev server doesn't do this, so the `webflow` global would be undefined. Every change requires build + restart.

### Running services

| Service | Port | Command |
|---------|------|---------|
| Next.js backend | 3000 | `cd data-client && npm run dev` |
| ngrok tunnel | — | `ngrok http 3000` |
| Extension server | 5173 | `npx webflow extension serve 5173` |

The ngrok URL goes in `designer-extension/.env` as `VITE_API_URL`. Must rebuild after changing.

## What's Next — Priority Order

### P0: Fix text content
- Use `Paragraph`/`Heading` presets for TEXT nodes instead of DivBlock
- Call `setTextContent()` on the correct element type
- Verify `node.characters` is populated in the build plan from Figma API
- Test: Announcement Bar should show "The full Webflow Conf 2025 agenda is here!" text

### P1: Use correct presets
- `wf.elementPresets.Section` for top-level sections
- `wf.elementPresets.Paragraph` / `wf.elementPresets.Heading` for text
- `wf.elementPresets.DivBlock` for generic containers
- Map `plan.preset` → `wf.elementPresets[plan.preset]` dynamically
- Test which presets support `append()` for children vs text-only

### P2: Visual fidelity
- Image fills (background images from Figma image export API)
- Gradients (linear, radial)
- Strokes → CSS borders
- Mixed text styles (bold/italic within a paragraph)

### P3: Layout accuracy
- Absolute positioning for non-auto-layout frames
- Min/max width/height constraints
- Responsive behavior from Figma constraints

### P4: Consider Claude API as mapper (hybrid approach)

The deterministic mapper handles basic cases but struggles with the edge cases Claude handled naturally in the artifact (nested components, mixed content, ambiguous structures). A hybrid approach could be the best of both worlds:

**How it would work:**
1. Backend fetches Figma JSON directly (already built, no rate limits)
2. Send that JSON to Claude API in a single call: "convert this Figma node tree to a build plan"
3. Claude returns the build plan → existing builder executes it in Webflow
4. One API call per section, no MCP servers involved

**Why this is better than the MCP artifact approach:**
- No Figma MCP rate limits — we fetch Figma JSON directly via REST API
- No Webflow MCP rate limits — we use the Designer API directly
- Claude only does the translation (Figma JSON → build plan), not the reading/writing
- A section's Figma JSON is ~10-20K tokens in, ~2-5K tokens out → a few cents per section

**Options:**
- **Replace** the deterministic mapper entirely with Claude API — simpler code, handles all edge cases
- **Augment** — use deterministic mapper for the 80% straightforward cases, Claude API as fallback for complex layouts/components
- **Keep deterministic only** — no API cost, fully predictable, but more code to maintain for edge cases

Would need a Claude API key (Anthropic API). Implementation: one new route in data-client (`/api/mapper/build-plan-ai`) that calls the Anthropic SDK instead of the deterministic mapper functions.

### P5: Developer experience
- Watch mode (`nodemon` or `chokidar`) that auto-builds on file changes
- Better error messages in the UI
- Remove debug `console.log` and `console.warn` statements
- Remove "Designer API: available/not available" diagnostic indicator

## Key Files

| File | Purpose |
|------|---------|
| `designer-extension/src/builder/element-creator.ts` | Creates elements in Webflow Designer — **main file to fix for P0/P1** |
| `designer-extension/src/builder/style-creator.ts` | Creates and applies CSS styles |
| `designer-extension/src/steps/BuildStep.tsx` | Build UI (progress, retry, errors) |
| `designer-extension/src/services/api.ts` | HTTP client to backend, token storage |
| `designer-extension/src/steps/SetupStep.tsx` | Auth UI (Figma PAT input, Webflow OAuth) |
| `designer-extension/webflow.json` | Extension config (`apiVersion: "2"`, `publicDir: "dist"`) |
| `data-client/lib/mapper/index.ts` | Main mapper: Figma node → build plan |
| `data-client/lib/mapper/typography.ts` | Text styles → CSS |
| `data-client/lib/mapper/layout.ts` | Auto-layout → flexbox |
| `data-client/lib/mapper/fills.ts` | Fills → background-color |
| `data-client/lib/figma/client.ts` | Figma REST API client (`X-Figma-Token` header) |
| `data-client/lib/figma/parser.ts` | Extracts sections from Figma file structure |

## Deployment

### Current: Local development only

Everything runs locally with ngrok tunneling. This works but requires 3 terminal windows and a manual rebuild cycle.

### Production target: Vercel + Webflow App Store

The goal is a standalone app that anyone can install from the Webflow App Marketplace — no local setup, no tokens, just connect and build.

### Architecture in production

```
Webflow Designer (browser)
┌──────────────────────────────────┐
│  Designer Extension              │
│  (static files on Vercel/CDN)    │
│  ─── calls backend via HTTPS ──────┐
└──────────────────────────────────┘  │
                                      ▼
                              ┌──────────────────┐
                              │  Data Client      │
                              │  (Vercel/Node.js) │
                              │  ─ Figma REST API │
                              │  ─ Claude API     │
                              │  ─ Webflow OAuth  │
                              └──────────────────┘
```

### Step-by-step deployment

**1. Deploy data-client to Vercel**
- Connect the GitHub repo
- Set root directory to `data-client`
- Framework preset: Next.js
- Add environment variables in Vercel dashboard:
  - `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`
  - `WEBFLOW_CLIENT_ID`, `WEBFLOW_CLIENT_SECRET`
  - `SESSION_SECRET` (generate with `openssl rand -hex 32`)
  - `NEXT_PUBLIC_APP_URL` → the Vercel deployment URL
  - `ANTHROPIC_API_KEY` (if using Claude API hybrid mapper)

**2. Deploy designer-extension as static site**

Option A: Vercel
- Set root directory to `designer-extension`
- Build command: `npm run build`
- Output directory: `dist`
- Add env: `VITE_API_URL` → data-client Vercel URL

Option B: Cloudflare Pages (free, fast CDN)
- Connect repo, set build output to `designer-extension/dist`
- Same `VITE_API_URL` env var

**3. Update Webflow App settings**
- In the Webflow Developer dashboard, update the Designer Extension URL to the deployed static site URL
- Update OAuth callback URLs to point to the Vercel data-client URL
- No more ngrok needed

**4. Update Figma App settings**
- OAuth callback URL → `https://<data-client>.vercel.app/api/auth/figma/callback`
- Must get Figma OAuth unblocked (see "Figma Auth" section above)

**5. Submit to Webflow App Marketplace (optional)**
- Once stable, submit for review to make it installable by any Webflow user
- Requires app description, screenshots, privacy policy

### What changes for deployment vs local dev

| Concern | Local (now) | Production |
|---------|------------|------------|
| HTTPS | ngrok tunnel | Vercel handles it |
| Designer API injection | `webflow extension serve` | Webflow injects automatically when served from registered URL |
| Figma auth | Personal access token | OAuth (needs org approval) |
| Backend URL | ngrok URL in `.env` | Vercel URL, set once |
| Rebuilds | Manual `npm run build` | Auto-deploy on git push |
| Cost | Free | Free tier covers it (Vercel free, Figma API free, Claude API ~cents/use) |

### Key prerequisite: Figma OAuth must work
The personal access token approach is a dev workaround. For a real deployed app, users need OAuth. This is blocked by org-level Figma settings — see the "Figma Auth" section above for how to unblock.

## Mapper Coverage

### Working

| Figma Property | CSS Output | File |
|---|---|---|
| Auto-layout direction | `flex-direction` | layout.ts |
| Auto-layout gap | `gap` | layout.ts |
| Auto-layout padding | `padding-*` | layout.ts |
| Primary axis align | `justify-content` | layout.ts |
| Cross axis align | `align-items` | layout.ts |
| Child grow | `flex-grow: 1` | layout.ts |
| Solid fill | `background-color` | fills.ts |
| Text fill color | `color` | fills.ts |
| Font family | `font-family` | typography.ts |
| Font size | `font-size` | typography.ts |
| Font weight | `font-weight` | typography.ts |
| Line height | `line-height` | typography.ts |
| Letter spacing | `letter-spacing` | typography.ts |
| Text align | `text-align` | typography.ts |
| Text transform | `text-transform` | typography.ts |
| Text decoration | `text-decoration` | typography.ts |
| Width/Height | `width` / `height` | geometry.ts |
| Border radius | `border-radius` | geometry.ts |
| Opacity | `opacity` | geometry.ts |
| Clip content | `overflow: hidden` | geometry.ts |
| Drop shadow | `box-shadow` | effects.ts |
| Inner shadow | `box-shadow` (inset) | effects.ts |
| Layer blur | `filter: blur()` | effects.ts |
| Background blur | `backdrop-filter: blur()` | effects.ts |

### Not implemented

| Figma Property | Notes |
|---|---|
| Image fills | Need Figma image export API |
| Gradients | Placeholder in fills.ts |
| Strokes | Not started |
| Absolute positioning | Not started |
| Constraints (responsive) | Not started |
| Component instances | Not started |
| Mixed text styles | Not started |
| Blend modes | Not started |
| Vector/Boolean shapes | Skipped entirely |
