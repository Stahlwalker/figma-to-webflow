# Clipboard Import Approach: Figma → Webflow via Copy-Paste

## Concept

Skip the Webflow MCP, Designer Extension, and OAuth entirely. Instead, generate Webflow's native clipboard JSON from a Figma design and let the user paste it directly into the Webflow Designer.

```
Figma URL → [App reads design] → [Translate to Webflow clipboard JSON] → Copy → Paste into Designer
```

## How Webflow's Clipboard Works

When you copy elements in the Webflow Designer, the clipboard contains structured JSON under the MIME type `application/x-webflow-elements`. This JSON describes:

- Element types (Section, DivBlock, Heading, Paragraph, LinkBlock, Image, etc.)
- Style definitions (CSS properties in Webflow's internal format)
- Element nesting / hierarchy
- Text content
- Heading levels, link targets, image references
- Class names and combo classes

When pasted into any Webflow project, the Designer reconstructs native elements from this JSON — fully editable, with proper classes, responsive breakpoints, and all Designer features intact.

## Why This Works

- **Native output** — pasted elements are real Webflow elements, not HTML embeds. Full Designer editing, CMS bindings, interactions — everything works.
- **No integration required** — no app install, no OAuth, no MCP connection, no Designer Extension. Works with any Webflow project.
- **No API limitations** — bypasses all the MCP tool gaps (no embed support, no asset upload, no delete). The clipboard format supports everything the Designer supports.
- **Simple UX** — paste a Figma URL, click "Copy", paste into Webflow. Three steps.

## The App

A simple web app (could be a single page):

1. **Input:** Figma URL (with optional node-id for specific sections)
2. **Processing:**
   - Read design from Figma REST API
   - Run through translation engine (existing mappers: layout, typography, fills, geometry, effects)
   - Convert translated output to Webflow clipboard JSON format
3. **Output:** "Copy to Clipboard" button that writes the JSON to the clipboard with the correct MIME type
4. **User action:** Cmd+V in the Webflow Designer

### Auth

- Figma: user provides a Figma Personal Access Token (one-time setup) or OAuth
- Webflow: none needed — clipboard doesn't require any Webflow auth

## What Needs to Be Figured Out

### 1. Reverse-Engineer the Clipboard Format

The clipboard JSON schema is not publicly documented. To figure it out:

- Open Webflow Designer
- Build elements manually (Section, DivBlock with flex layout, Heading, Paragraph, styled LinkBlock, Image)
- Copy them
- Inspect clipboard contents (use a clipboard viewer tool or `navigator.clipboard.read()` in browser console)
- Document the JSON schema for each element type
- Test by modifying the JSON and pasting back — confirm Webflow accepts it

Key questions to answer:
- How are styles/classes represented? (inline vs referenced by ID)
- How are nested elements structured?
- How are text content and heading levels encoded?
- Are element IDs required or auto-generated on paste?
- Does pasting preserve or regenerate style IDs?
- How are images/assets referenced?
- What's the minimum viable JSON for a single element?

### 2. Style Handling

Two possible approaches:
- **Inline styles in clipboard JSON** — each element carries its own style properties. Simpler but may create duplicate classes.
- **Named styles/classes** — clipboard includes class definitions that Webflow merges with existing project styles. Better for reuse but may conflict with existing class names.

Need to test which approach Webflow's paste handler supports.

### 3. Asset References

Images in the clipboard likely reference Webflow asset IDs. When pasting into a new project, these IDs won't exist. Options:
- Paste without images, user adds manually (same limitation as MCP approach)
- Include image URLs that Webflow downloads on paste (if supported)
- Pre-upload assets via Webflow Data API, then reference the IDs in clipboard JSON

### 4. Clipboard API Browser Restrictions

Writing custom MIME types to the clipboard requires:
- `navigator.clipboard.write()` with a `ClipboardItem`
- The page must have clipboard-write permission
- Some browsers restrict custom MIME types — may need to use `text/plain` fallback with a bookmarklet or browser extension to write the Webflow-specific MIME type

If the browser blocks the custom MIME type, alternatives:
- **Browser extension** — small extension that handles clipboard writing
- **Bookmarklet** — user drags to bookmark bar, clicks to copy
- **Desktop app** (Electron/Tauri) — full clipboard access, no restrictions

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Webflow changes clipboard format | App breaks | Version detection, monitor Webflow updates |
| Format is too complex to reverse-engineer | Can't build it | Start with simple elements, build up incrementally |
| Browser blocks custom MIME types | Copy doesn't work | Browser extension or desktop app fallback |
| Pasted styles conflict with existing project styles | Visual bugs | Namespace class names or let user choose prefix |
| Webflow actively blocks third-party clipboard writes | Dead end | Unlikely — copy-paste between sites already works |

## Validation Steps

1. **Copy a styled section from Webflow Designer** — inspect the clipboard JSON
2. **Manually edit the JSON** (change text, colors) — paste back and confirm it works
3. **Build minimal JSON from scratch** — single DivBlock with a style — paste and confirm
4. **Write a script that generates the JSON** — test with a simple Figma frame
5. **If all of the above work** — build the full app

If step 1 reveals a readable, reproducible format, the approach is viable. If the format is encrypted, obfuscated, or contains non-reproducible tokens, it's a dead end.

## Comparison to Other Approaches

| Approach | Native Elements | Auth Required | Limitations |
|---|---|---|---|
| **Clipboard Import** | Yes | Figma only | Clipboard format undocumented, may break |
| MCP Server | Yes | Figma + Webflow MCP | No embeds, no assets, no delete, slow iteration |
| Designer Extension | Yes | Figma + Webflow OAuth | Install required, UX friction |
| HTML/CSS Generator | No (embed only) | Figma only | Loses Webflow editing, CMS, interactions |

## Existing Translation Logic to Reuse

All of the mapper code in `data-client/lib/mapper/` applies directly:

- `layout.ts` — auto-layout → flexbox
- `typography.ts` — font properties + heading inference
- `fills.ts` — colors and gradients
- `geometry.ts` — sizing, border-radius, opacity
- `effects.ts` — shadows and blur
- `index.ts` — orchestration and tree traversal

The only new piece is the **output formatter** — converting `WebflowBuildPlan` objects into Webflow's clipboard JSON schema instead of MCP tool calls.
