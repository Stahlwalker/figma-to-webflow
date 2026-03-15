# MCP Workflow — Quick Start

## How It Works

1. Open Claude Code in this project directory (CLAUDE.md auto-loads)
2. Paste a Figma URL
3. Claude reads the design via Figma MCP → builds it in Webflow via Webflow MCP

No app install. No OAuth. No backend.

## Build → Verify → Fix Loop

1. **Build**: Claude creates styles + elements following CLAUDE.md workflow
2. **Verify**: `element_snapshot_tool` screenshots what was built in Webflow
3. **Compare**: side-by-side with Figma screenshot from `get_screenshot`
4. **Fix**: adjust with `element_tool` (modify elements) and `style_tool > update_style` (tweak CSS)
5. **Re-verify**: snapshot again until pixel-perfect

## Debugging Tools

| Tool | Use For |
|---|---|
| `element_snapshot_tool` | Visual screenshot of built elements |
| `element_tool > get_all_elements` | Dump full element tree with styles |
| `style_tool > get_styles` | List all styles with properties |
| `webflow_guide_tool` | Webflow best practices and guidelines |

## Reference Docs

| File | Contents |
|---|---|
| `property-mappings.md` | Figma properties → CSS values |
| `webflow-element-mapping.md` | Figma node types → Webflow element types |
| `webflow-style-rules.md` | Webflow style_tool constraints and gotchas |
| `depth-batching.md` | Handling the 3-level element_builder limit |

## Testing Progression

Start simple, increase complexity:
1. **Announcement bar** — flat, 2–3 levels, text + background color
2. **Navigation bar** — 3–4 levels, links, buttons
3. **Hero section** — 4–5 levels, images, deeper nesting
4. **Full page** — multiple sections, assets, responsive styles
