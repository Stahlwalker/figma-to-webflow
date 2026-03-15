# Webflow Style Rules & Constraints

Rules specific to the Webflow `style_tool` and `element_builder` MCP tools.

## Long-Form CSS Properties Required

Webflow requires long-form property names. Do NOT use shorthand.

| Shorthand (don't use) | Long-form (use these) |
|---|---|
| `padding: 10px 20px` | `padding-top: 10px`, `padding-right: 20px`, `padding-bottom: 10px`, `padding-left: 20px` |
| `margin: auto` | `margin-top: auto`, `margin-right: auto`, `margin-bottom: auto`, `margin-left: auto` |
| `border: 1px solid red` | `border-top-width: 1px`, `border-top-style: solid`, `border-top-color: red`, etc. |
| `border-radius: 8px` | `border-top-left-radius: 8px`, `border-top-right-radius: 8px`, `border-bottom-right-radius: 8px`, `border-bottom-left-radius: 8px` |
| `row-gap` | `grid-row-gap` |

Properties that work as-is: `display`, `flex-direction`, `gap`, `flex-wrap`, `justify-content`,
`align-items`, `align-self`, `flex-grow`, `width`, `height`, `background-color`, `color`,
`font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-align`,
`text-transform`, `text-decoration`, `opacity`, `overflow`, `box-shadow`, `filter`,
`backdrop-filter`.

## Style Creation Order

1. Create ALL styles first using `style_tool > create_style`
2. Then create elements that reference those styles by name
3. Styles must exist before `element_builder` references them via `set_style > style_names`

## Combo Classes

Use `parent_style_name` when creating a style to make it a combo class:
- Base class: `nav-link` (shared properties)
- Combo class: `nav-link-active` with `parent_style_name: "nav-link"` (overrides)

## Breakpoints

Use `style_tool > update_style` with `breakpoint_id` for responsive styles:

| Breakpoint | ID | Width |
|---|---|---|
| Extra extra large | `xxl` | 1920px+ |
| Extra large | `xl` | 1440px+ |
| Large | `large` | 1280px+ |
| **Main (desktop)** | `main` | 992px+ |
| Tablet | `medium` | 768px–991px |
| Mobile landscape | `small` | 480px–767px |
| Mobile portrait | `tiny` | <480px |

Always create styles for `main` breakpoint first, then add responsive overrides.

## Pseudo-Classes

`update_style` supports pseudo selectors:
- `hover`, `active`, `focus`, `focus-visible`, `focus-within`
- `visited`, `link`
- `before`, `after`
- `first-child`, `last-child`, `odd`, `even`
- `placeholder`

## Common Gotchas

- Element styles are set by **name** (string), not inline CSS objects
- `background` shorthand for gradients may not work — use `background-image` for linear-gradient
- `gap` works for flexbox but use `grid-row-gap` / `grid-column-gap` for grid
- Colors must be valid CSS values (rgb/rgba/hex) — Figma 0–1 floats must be converted
- `auto` dimensions: omit the property entirely rather than setting it to `auto`
