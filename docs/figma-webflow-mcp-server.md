# Figma-to-Webflow Translation MCP Server

## Problem

Existing Figma-to-Webflow tools are poor. They produce absolute-positioned layouts instead of flexbox, generate messy class names, lose text semantics, and require extensive manual cleanup. The root cause isn't the reading or writing — it's the translation layer in between.

We've built and tested a translation engine that handles layout, typography, colors, effects, sizing, and semantic HTML inference. It's currently spread across TypeScript mappers and markdown docs. Packaging it as an MCP server makes it consumable by any AI assistant — including Webflow's own AI.

## How It Works

```
┌─────────┐      ┌──────────────────────────────┐      ┌──────────────┐
│         │      │   MCP Server                  │      │              │
│  Figma  │◄────►│                               │◄────►│  AI Assistant │
│  API    │      │  - Reads Figma designs        │      │  (Webflow AI,│
│         │      │  - Translates to Webflow spec │      │   Claude,    │
└─────────┘      │  - Returns build-ready output │      │   etc.)      │
                 └──────────────────────────────┘      └──────┬───────┘
                                                              │
                                                              ▼
                                                       ┌──────────────┐
                                                       │   Webflow    │
                                                       │   Designer   │
                                                       └──────────────┘
```

The MCP server owns the intelligence. It reads a Figma design, runs it through the translation engine, and returns Webflow-native specs. The AI assistant doesn't need to understand Figma's data model or Webflow's quirks — it just executes the build plan.

## MCP Tools

### `get_webflow_spec`

The primary tool. Takes a Figma URL and returns everything needed to build the section in Webflow.

**Input:**
```json
{
  "figma_url": "https://figma.com/design/abc123/file?node-id=1:5318",
  "options": {
    "include_styles": true,
    "include_elements": true,
    "include_batch_plan": true
  }
}
```

**Output:**
```json
{
  "styles": [
    {
      "name": "hero-section",
      "properties": {
        "display": "flex",
        "flex-direction": "column",
        "align-items": "center",
        "padding-top": "72px",
        "padding-bottom": "72px",
        "background-color": "#ffffff"
      }
    },
    {
      "name": "hero-heading",
      "properties": {
        "font-family": "\"Inter\", sans-serif",
        "font-size": "80px",
        "font-weight": "600",
        "letter-spacing": "-0.8px",
        "line-height": "84px",
        "color": "#0a0a0a"
      }
    }
  ],
  "elements": {
    "type": "Section",
    "style": "hero-section",
    "children": [
      {
        "type": "Heading",
        "style": "hero-heading",
        "heading_level": 1,
        "text": "Bring full-stack web apps to your website experience",
        "children": []
      }
    ]
  },
  "batch_plan": [
    {
      "batch": 1,
      "parent": "body",
      "depth_range": "0-2",
      "elements": ["hero-section", "hero-inner", "hero-heading", "hero-paragraph"]
    },
    {
      "batch": 2,
      "parent": "hero-buttons-wrap",
      "depth_range": "3-4",
      "elements": ["hero-btn-primary", "hero-btn-secondary"]
    }
  ],
  "warnings": [
    "Node 1:5322 is a VECTOR — created as placeholder div (no icon/SVG support)",
    "Node 1:5320 has image fill — created as Image placeholder (asset must be uploaded manually)"
  ]
}
```

### `get_styles`

Returns only the style definitions. Useful when the AI wants to create styles before building elements.

**Input:**
```json
{
  "figma_url": "https://figma.com/design/abc123/file?node-id=1:5318"
}
```

**Output:** Array of `{ name, properties }` objects with Webflow-compatible long-form CSS.

### `get_element_tree`

Returns only the element hierarchy without styles. Useful for understanding structure before building.

**Input:**
```json
{
  "figma_url": "https://figma.com/design/abc123/file?node-id=1:5318"
}
```

**Output:** Nested tree of `{ type, style_name, text?, heading_level?, children }`.

### `translate_node`

Translates a single Figma node JSON blob. For incremental or custom use cases where the caller already has the Figma data.

**Input:**
```json
{
  "node": { "id": "1:5318", "type": "FRAME", "layoutMode": "VERTICAL", ... }
}
```

**Output:** Same format as `get_webflow_spec` but for one node.

## Translation Engine

### What Exists Today

Six TypeScript modules in `data-client/lib/mapper/`:

| Module | File | Translates |
|---|---|---|
| **Layout** | `layout.ts` | Auto-layout → flexbox (display, flex-direction, gap, justify-content, align-items, padding, flex-wrap) |
| **Typography** | `typography.ts` | Font properties + semantic tag inference (h1-h6 vs p based on layer name and font size) |
| **Fills** | `fills.ts` | Solid colors → rgba, linear gradients → CSS gradient, text color extraction |
| **Geometry** | `geometry.ts` | Width/height with smart flex sizing, border-radius (uniform + per-corner), opacity, overflow |
| **Effects** | `effects.ts` | Drop/inner shadows → box-shadow, layer blur → filter, background blur → backdrop-filter |
| **Orchestrator** | `index.ts` | Node type dispatch, recursive tree traversal, layout context passing, style name generation |

Supporting types in `data-client/lib/figma/types.ts` and `data-client/lib/mapper/types.ts`.

### Key Translation Rules

**Node Type → Webflow Element:**

| Figma Type | Webflow Element | Condition |
|---|---|---|
| `SECTION` | Section | Top-level frame only |
| `FRAME` / `GROUP` / `COMPONENT` / `INSTANCE` | DivBlock | General containers |
| `TEXT` | Heading (h1-h6) | Font size ≥ 20px or layer name contains "h1"-"h6" |
| `TEXT` | Paragraph | Font size < 20px or layer name contains "paragraph"/"body" |
| `RECTANGLE` with image fill | Image | Placeholder — asset needs manual upload |
| `RECTANGLE` / `ELLIPSE` / `LINE` | DivBlock | Styled div for shapes |
| `VECTOR` / `BOOLEAN_OPERATION` | DivBlock | Placeholder with dimensions only |
| Frame named "button" | LinkBlock | Use set_text + set_link |

**Heading Level Inference (priority order):**
1. Layer name contains "h1" or "heading 1" → level 1 (same pattern through h6)
2. Layer name contains "paragraph" or "body" → use Paragraph instead
3. Font size fallback: ≥40px → h1, ≥32px → h2, ≥24px → h3, ≥20px → h4

**Auto-Layout → Flexbox:**
- `layoutMode: "HORIZONTAL"` → `display: flex; flex-direction: row`
- `layoutMode: "VERTICAL"` → `display: flex; flex-direction: column`
- `primaryAxisAlignItems` → `justify-content` (MIN→flex-start, CENTER→center, MAX→flex-end, SPACE_BETWEEN→space-between)
- `counterAxisAlignItems` → `align-items` (same mapping)
- `itemSpacing` → `gap`
- `layoutWrap: "WRAP"` → `flex-wrap: wrap` + `counterAxisSpacing` → `row-gap`
- Individual padding properties mapped 1:1

**Smart Sizing:**
- `layoutGrow === 1` → skip width (fills container)
- `layoutAlign === "STRETCH"` → skip cross-axis dimension
- Otherwise → explicit `width` and `height` in px

**Color Conversion:**
- Figma uses 0-1 floats → multiply r/g/b by 255, round
- Alpha = `color.a × fill.opacity`
- Output `rgb()` when alpha is 1, `rgba()` otherwise

### What Needs to Be Added

| Gap | Description | Priority |
|---|---|---|
| **Strokes → borders** | `strokes` + `strokeWeight` → `border-width`, `border-style`, `border-color` | High |
| **Absolute positioning** | `layoutPositioning: "ABSOLUTE"` + constraints → `position: absolute` with top/left/right/bottom | High |
| **Image fills** | `fills[].type === "IMAGE"` → Image element with `imageRef` for asset lookup | Medium |
| **Radial gradients** | `GRADIENT_RADIAL` → `radial-gradient()` | Medium |
| **Constraints** | `constraints.horizontal/vertical` → positioning logic for non-auto-layout frames | Medium |
| **Component instances** | Override properties on INSTANCE nodes | Low |
| **Mixed text styles** | `characterStyleOverrides` + `styleOverrideTable` → rich text spans | Low |
| **Rotation** | `rotation` → `transform: rotate()` | Low |

## Edge Cases From Live Building

These were discovered building 4 sections (announcement bar, nav bar, hero, video embed) on a real Webflow site:

1. **TextBlock inside any container becomes a DivBlock.** Never create TextBlock as a child of LinkBlock or DivBlock. Use `set_text` directly on the parent LinkBlock. For DivBlocks, use `set_text` on the child String element.

2. **Figma text style labels pollute content.** Text nodes may include style prefixes like "Body 4 — " that aren't actual content. Strip anything before " — " when it matches a Figma text style pattern.

3. **Check `visible: false` before building.** Hidden Figma nodes should output `display: none` or be skipped entirely.

4. **Webflow DivBlock flex quirk.** DivBlock children inside a flex row may not honor `justify-content: space-between` even with `width: auto`. Workaround: use `position: absolute` for right-aligned items.

5. **Video/embed content = placeholder only.** Don't recreate YouTube player UI (channel info, play button, etc). Flag it as an embed placeholder and let the user drop in the native element.

6. **element_builder has a 3-level depth limit.** Designs deeper than 3 levels must be batched. The server should output a batch plan with parent element references.

7. **Styles must use long-form CSS.** Webflow rejects shorthand. Output `padding-top`, `padding-right`, `padding-bottom`, `padding-left` — never `padding`.

8. **No asset upload via MCP.** Image elements can be created as placeholders with correct dimensions, but the actual asset must be uploaded manually.

9. **No element deletion via MCP.** Mistakes can only be hidden with `display: none`, not removed. The translation must be right the first time.

10. **`element_builder` prepend may not work.** Use CSS `order: -1` as a workaround for element ordering.

## Webflow AI Integration

Webflow's AI assistant already has access to the Designer (element creation, styling, etc). What it lacks is the Figma reading and translation layer.

**User flow:**
1. User opens Webflow Designer with AI assistant
2. User pastes a Figma URL: "Build this section from Figma"
3. Webflow AI calls `get_webflow_spec` on the MCP server
4. Server reads the Figma design, translates it, returns the build plan
5. Webflow AI creates styles using the returned style definitions
6. Webflow AI creates elements in batches using the returned element tree
7. Webflow AI takes a snapshot and compares to the Figma screenshot
8. Done — or AI fixes discrepancies using the server's translation as ground truth

**Why this is better than current tools:**
- Translation quality is higher (flexbox not absolute positioning, semantic tags, clean class names)
- Edge cases are handled (the server encodes all the quirks we discovered)
- Works with any AI assistant, not locked to one platform
- Server-side means it can be updated without users reinstalling anything

## Technical Implementation

### Stack
- **Runtime:** Node.js / TypeScript
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Figma client:** REST API with PAT or OAuth
- **No Webflow dependency** — the server only reads Figma and outputs specs. The AI assistant handles Webflow.

### Structure
```
figma-webflow-mcp/
├── src/
│   ├── server.ts              # MCP server setup + tool registration
│   ├── figma/
│   │   ├── client.ts          # Figma REST API client
│   │   └── types.ts           # Figma node types (from existing)
│   ├── translator/
│   │   ├── index.ts           # Orchestrator (from existing mapper/index.ts)
│   │   ├── layout.ts          # Auto-layout → flexbox (from existing)
│   │   ├── typography.ts      # Font + tag inference (from existing)
│   │   ├── fills.ts           # Colors + gradients (from existing)
│   │   ├── geometry.ts        # Sizing + shape (from existing)
│   │   ├── effects.ts         # Shadows + blur (from existing)
│   │   ├── strokes.ts         # NEW: borders
│   │   └── positioning.ts     # NEW: absolute positioning + constraints
│   ├── webflow/
│   │   ├── element-mapping.ts # Node type → Webflow element preset
│   │   ├── style-formatter.ts # Ensure long-form CSS, Webflow-safe values
│   │   └── batch-planner.ts   # Depth batching for 3-level limit
│   └── output/
│       └── types.ts           # WebflowSpec, StyleDef, ElementTree, BatchPlan
├── package.json
├── tsconfig.json
└── README.md
```

### What's Reusable vs New

**Direct port from existing code (80% of the work is done):**
- `translator/layout.ts` ← `data-client/lib/mapper/layout.ts`
- `translator/typography.ts` ← `data-client/lib/mapper/typography.ts`
- `translator/fills.ts` ← `data-client/lib/mapper/fills.ts`
- `translator/geometry.ts` ← `data-client/lib/mapper/geometry.ts`
- `translator/effects.ts` ← `data-client/lib/mapper/effects.ts`
- `translator/index.ts` ← `data-client/lib/mapper/index.ts`
- `figma/types.ts` ← `data-client/lib/figma/types.ts`

**New code needed:**
- `server.ts` — MCP server boilerplate + tool definitions
- `figma/client.ts` — Figma REST API calls (node data, images)
- `webflow/element-mapping.ts` — node type → Webflow preset logic (from `mcp-workflow/webflow-element-mapping.md`)
- `webflow/style-formatter.ts` — convert CSS to Webflow long-form format (from `mcp-workflow/webflow-style-rules.md`)
- `webflow/batch-planner.ts` — depth analysis + batching (from `mcp-workflow/depth-batching.md`)
- `translator/strokes.ts` — border translation (new)
- `translator/positioning.ts` — absolute positioning (new)
