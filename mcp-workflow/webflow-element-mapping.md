# Figma Node Types → Webflow Elements

## Element Type Mapping

| Figma Node Type | Webflow Element | Notes |
|---|---|---|
| `SECTION` (top-level frame) | `Section` | Always use for outermost container |
| `FRAME` | `DivBlock` | General container |
| `GROUP` | `DivBlock` | General container |
| `COMPONENT` | `DivBlock` | Treat same as frame |
| `INSTANCE` | `DivBlock` | Treat same as frame (no override logic yet) |
| `TEXT` (fontSize >= 20) | `Heading` | Set heading_level 1–6 |
| `TEXT` (fontSize < 20) | `Paragraph` | |
| `TEXT` (short, label-like) | `TextBlock` | Single-line text |
| `RECTANGLE` with image fill | `Image` | Use set_image_asset |
| `RECTANGLE` / `ELLIPSE` / `LINE` | `DivBlock` | Styled div for shapes |
| `VECTOR` / `BOOLEAN_OPERATION` | `DivBlock` | Placeholder with dimensions only |
| Frame named "button" | `Button` | Use set_text and set_link |
| Frame wrapping a link | `LinkBlock` | Use set_link |

## Elements That Accept Children

These can contain other elements:
- `Section`
- `Container`
- `DivBlock`
- `LinkBlock`
- `DOM` (custom tag)

## Elements That Accept Text (via `set_text`)

These accept text content directly:
- `Heading` — use set_heading_level (1–6)
- `Paragraph`
- `TextBlock`
- `Button`
- `TextLink`
- `LinkBlock` — **set_text works directly on LinkBlock!**

These are always **leaf nodes** — never put children inside them.

## Critical: TextBlock Inside Containers

**NEVER create a TextBlock child inside a LinkBlock or DivBlock.** It becomes a DivBlock with placeholder text "This is some text inside of a div block." This applies to ALL container parents, not just LinkBlock.

Instead, use `set_text` directly on the LinkBlock element:
- In `element_builder`: use `set_text` property on the LinkBlock itself
- In `element_tool`: use `set_text` action targeting the LinkBlock's ID
- Include ALL text styling (color, font-family, font-size, font-weight, text-decoration) in the **LinkBlock's own style** — there's no child element to style separately

For nav links (inline text links), use `TextLink` type with `set_text` — this works correctly.

## Fixing DivBlock Placeholder Text

If a DivBlock has incorrect placeholder text ("This is some text inside of a div block."):
- `set_text` does NOT work on DivBlock elements
- Instead, use `set_text` on the **child String element** (element ID typically ends in one digit higher than the parent)
- Get the String element ID from `get_all_elements` response
- There is **no delete element capability** in the current MCP tools

## Heading Level Inference

Priority order:
1. **Layer name hints**: "h1" or "heading 1" → level 1, "h2" or "heading 2" → level 2, etc.
2. **"paragraph" or "body" in name** → use Paragraph element instead
3. **Font size fallback**: >=40px → h1, >=32px → h2, >=24px → h3, >=20px → h4

Anything below 20px font size → use `Paragraph` instead of `Heading`.

## Style Naming Convention

Generate style names from Figma layer names:
1. Remove special characters (keep letters, numbers, spaces, hyphens, underscores)
2. Replace spaces with hyphens
3. Lowercase
4. Truncate to 40 chars
5. If duplicates exist, append a short suffix

Example: "Hero CTA Button" → `hero-cta-button`
