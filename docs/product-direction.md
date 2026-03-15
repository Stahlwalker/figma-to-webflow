# Product Direction: Figma-to-Webflow Importer

## The Honest Assessment

After building 4 sections via MCP, researching every Webflow API, and documenting multiple approaches, here's where things stand.

### Every Way Into Webflow (There Are Only 3)

There is no secret API. There are exactly three ways to programmatically create native Webflow elements:

| Entry Point | Native Elements | Proven By | Auth | Limitations |
|---|---|---|---|---|
| **Designer API** (via Extension or MCP) | Yes | Webflow's own Figma plugin | Webflow App install + OAuth | Must run inside Designer; MCP has gaps |
| **Clipboard XscpData JSON** | Yes | Relume, Flowbase, Mozaik | None for Webflow | Undocumented format; browser clipboard quirks |
| **Data API v2 REST** | **No** | — | API token | Can only update existing text; cannot create elements |

The Data API is a dead end for what we need. It manages CMS content and existing page text — it cannot create layout elements, sections, or styles.

That leaves two real options: **Designer API** or **Clipboard**.

### What We Tried (MCP = Designer API Subset)

The Webflow MCP is a thin wrapper around the Designer API, exposed through a bridge app. Our experience building with it:

- Layout translation quality is **good** (flexbox, typography, colors all work)
- But the tools are **incomplete** — no embeds, no asset upload, no delete, 3-level depth limit
- Every section required **3-5 rounds of build-snapshot-fix**
- Complex sections (video, images, icons) still needed **manual Designer work**
- Not viable as a product — too much back-and-forth, too many gaps

### What Already Works in the Market

**Relume** sells a component library. Their entire business model is: user browses pre-built sections on relume.io → clicks "Copy" → pastes into Webflow Designer → native elements appear. They use the `@webflow/XscpData` clipboard JSON format.

This is the same fundamental operation we need, except our input is a Figma design instead of a pre-built template.

---

## Recommended Approach: Clipboard Importer

### The Product

A web app where you paste a Figma URL and get Webflow-ready clipboard data.

```
[Figma URL] → [Read Design] → [Translate] → [Generate XscpData JSON] → [Copy] → [Paste in Webflow]
```

### User Flow

1. Go to the app (web page)
2. Connect Figma (one-time OAuth or paste a Personal Access Token)
3. Paste a Figma URL or browse your files
4. Select a frame/section to convert
5. See a preview + any warnings (unsupported elements, missing fonts)
6. Click **"Copy for Webflow"**
7. Switch to Webflow Designer, Cmd+V
8. Native Webflow elements appear — fully editable, proper classes, flexbox layouts

### Why This Approach

**Proven model.** Relume, Flowbase, and Mozaik all ship products using the XscpData clipboard format. It's been stable enough for real businesses.

**Zero Webflow auth.** The clipboard doesn't talk to Webflow's servers. It's just structured data that the Designer's paste handler interprets. No OAuth, no API tokens, no app install.

**Full fidelity.** The clipboard format supports everything the Designer supports — all element types (including YouTubeVideo, HtmlEmbed, Forms), all CSS properties, breakpoints, combo classes, interactions. No artificial limits like the MCP's 3-level depth or missing element types.

**Simple UX.** Copy-paste is an interaction every user already knows. No learning curve.

**No ongoing Webflow dependency.** The app only needs Figma access. Webflow never needs to approve, host, or even know about it.

### The XscpData Format

When you copy elements in Webflow Designer, the clipboard contains JSON like this:

```json
{
  "type": "@webflow/XscpData",
  "payload": {
    "nodes": [
      {
        "_id": "unique-id",
        "tag": "div",
        "classes": ["class-id-1"],
        "children": ["child-id-1", "child-id-2"],
        "type": "Block",
        "data": { "tag": "div" }
      },
      {
        "_id": "child-id-1",
        "tag": "h1",
        "classes": ["class-id-2"],
        "children": [],
        "type": "Heading",
        "data": {
          "tag": "h1",
          "text": true
        },
        "v": "Bring full-stack web apps to your website"
      }
    ],
    "styles": [
      {
        "_id": "class-id-1",
        "name": "hero-section",
        "styleLess": "display: flex; flex-direction: column; align-items: center; padding-top: 72px; padding-bottom: 72px;",
        "variants": {},
        "children": []
      }
    ],
    "assets": [],
    "ix1": [],
    "ix2": { "interactions": [], "events": [], "actionLists": [] }
  },
  "meta": {
    "unlinkedSymbolCount": 0,
    "droppedLinks": 0,
    "dyn498ListBindings": []
  }
}
```

Key details:
- **`nodes`** — flat array of elements, linked by `_id` and `children` references
- **`styles`** — flat array of classes with `styleLess` (CSS as a semicolon-separated string)
- **`variants`** — breakpoint overrides (responsive styles)
- **`assets`** — image/file references
- **`ix2`** — Webflow interactions/animations

The format isn't documented by Webflow, but the community has mapped out the basics. The validation step is: copy a section from Webflow, inspect the JSON, modify it, paste it back. If it works, we can generate it.

### What We Have vs What We Need

**Already built (the hard part — translation intelligence):**
- `data-client/lib/mapper/layout.ts` — auto-layout → flexbox
- `data-client/lib/mapper/typography.ts` — fonts + semantic tag inference
- `data-client/lib/mapper/fills.ts` — colors + gradients
- `data-client/lib/mapper/geometry.ts` — sizing, border-radius, opacity
- `data-client/lib/mapper/effects.ts` — shadows, blur
- `data-client/lib/mapper/index.ts` — orchestrator, tree traversal
- Edge cases documented from 4 live section builds

**Needs to be built:**
1. **XscpData output formatter** — converts our `WebflowBuildPlan` tree into the clipboard JSON schema. This is the critical new piece.
2. **Figma API client** — REST calls to read designs (straightforward)
3. **Web app UI** — Figma URL input, preview, copy button
4. **Clipboard writer** — `navigator.clipboard.write()` with the correct MIME type

### Technical Stack

```
figma-to-webflow-app/
├── app/                        # Next.js or simple React app
│   ├── page.tsx                # Figma URL input + preview + copy button
│   └── api/
│       └── translate/route.ts  # API: Figma URL → XscpData JSON
├── lib/
│   ├── figma/
│   │   ├── client.ts           # Figma REST API (read nodes, images)
│   │   └── types.ts            # Figma types (from existing)
│   ├── translator/
│   │   ├── index.ts            # Orchestrator (from existing mapper)
│   │   ├── layout.ts           # (from existing)
│   │   ├── typography.ts       # (from existing)
│   │   ├── fills.ts            # (from existing)
│   │   ├── geometry.ts         # (from existing)
│   │   ├── effects.ts          # (from existing)
│   │   ├── strokes.ts          # NEW: borders
│   │   └── positioning.ts      # NEW: absolute positioning
│   └── webflow/
│       ├── xscpdata.ts         # NEW: generate XscpData clipboard JSON
│       ├── element-mapping.ts  # NEW: node type → Webflow element/tag
│       └── style-formatter.ts  # NEW: CSS → styleLess string format
├── package.json
└── tsconfig.json
```

---

## Risk: Browser Clipboard Restrictions

Modern browsers restrict writing custom MIME types to the clipboard. The XscpData format may require `application/json` or a Webflow-specific MIME type.

**If `navigator.clipboard.write()` works** — great, it's a pure web app.

**If the browser blocks it** — fallbacks:
1. **Chrome extension** (lightweight, just handles clipboard write — the app does everything else)
2. **"Copy as text" fallback** — user manually pastes JSON into a bookmarklet that writes it to clipboard correctly
3. **Desktop wrapper** (Electron/Tauri) — full clipboard access, no restrictions

Relume handles this somehow for their product, so there's a proven workaround.

---

## Alternative: Designer Extension (Backup Path)

If the clipboard approach hits a wall (format too complex, browser blocks it, Webflow breaks it), the fallback is a simplified Designer Extension:

- Minimal UI: just a text input for Figma URL + "Import" button
- Backend does the heavy lifting (Figma read + translation)
- Extension executes via Designer API (80+ element presets, including YouTubeVideo, HtmlEmbed)
- Has capabilities MCP lacks (more element types, better positioning)

The Designer API supports:
- `YouTubeVideo` preset — solves the video embed problem
- `HtmlEmbed` preset — for custom code/embeds
- `Image` with `setAsset()` — for images
- `NavbarWrapper`, `TabsWrapper`, `SliderWrapper` — complex interactive elements
- 32 pre-built layout presets

This is the "official" path but requires Webflow App registration, OAuth, and user install.

---

## Where AI Fits (Optional Enhancement)

The core translation is **deterministic** — it doesn't need AI. Auto-layout → flexbox, colors → CSS, font sizes → heading levels — these are rule-based mappings.

But AI could help with:

1. **Edge case handling** — when the Figma structure is ambiguous (is this a nav? a card grid? a hero section?), AI can infer intent and adjust the output
2. **Responsive generation** — AI can generate tablet/mobile breakpoint overrides based on the desktop layout
3. **Interaction suggestions** — "this looks like a dropdown, here's the interaction JSON"
4. **Natural language refinement** — "make the heading bigger" or "add more spacing" after the initial translation

This could use any LLM API (OpenAI, Claude, etc.) as an optional step between translation and output. The app would work without it — AI just makes it smarter.

---

## Validation: First 3 Steps

Before building anything, validate the clipboard approach:

1. **Inspect the format.** Open Webflow Designer, build a section with a styled DivBlock, Heading, and Paragraph. Copy it. Inspect the clipboard JSON. Document the schema.

2. **Modify and paste back.** Edit the JSON (change text, colors, add an element). Paste into Webflow. Confirm it creates native elements correctly.

3. **Generate from scratch.** Write a minimal JSON blob by hand (one DivBlock with a style). Paste it. If Webflow accepts hand-crafted XscpData, the approach is confirmed.

If all three work, build the app. If step 3 fails, fall back to the Designer Extension approach.

---

## Summary

| | Clipboard Importer | Designer Extension | MCP Workflow |
|---|---|---|---|
| **UX** | Copy-paste (3 steps) | Install app + click button | Chat with AI (many rounds) |
| **Webflow auth** | None | OAuth + install | MCP bridge app |
| **Element coverage** | Full (whatever clipboard supports) | Full (80+ presets) | Partial (MCP subset) |
| **Translation quality** | Same engine | Same engine | Same engine + AI iteration |
| **Biggest risk** | Clipboard format stability | App registration friction | Tool limitations |
| **Build effort** | Medium (format reverse-engineering) | Medium (existing extension code) | Done (but not productizable) |
| **Market precedent** | Relume, Flowbase, Mozaik | Webflow's own Figma plugin | None |

**Recommendation:** Start with clipboard validation (3 steps above). If it works, build the importer. The translation engine is 80% done — the main new work is the XscpData output formatter and a simple web UI.
