# Figma → CSS Property Mappings

Extracted from `data-client/lib/mapper/`. This is the reference for translating Figma node
properties into CSS when building in Webflow.

## Layout (Auto-Layout → Flexbox)

| Figma Property | Condition | CSS Property | Value |
|---|---|---|---|
| `layoutMode: "HORIZONTAL"` | present, not "NONE" | `display` | `flex` |
| `layoutMode: "HORIZONTAL"` | | `flex-direction` | `row` |
| `layoutMode: "VERTICAL"` | | `flex-direction` | `column` |
| `itemSpacing` | > 0 | `gap` | `{value}px` |
| `layoutWrap: "WRAP"` | | `flex-wrap` | `wrap` |
| `counterAxisSpacing` | > 0, only when WRAP | `row-gap` | `{value}px` |
| `paddingTop/Right/Bottom/Left` | any > 0 | `padding-top`, etc. | `{value}px` each |
| `primaryAxisAlignItems: "MIN"` | | `justify-content` | `flex-start` |
| `primaryAxisAlignItems: "CENTER"` | | `justify-content` | `center` |
| `primaryAxisAlignItems: "MAX"` | | `justify-content` | `flex-end` |
| `primaryAxisAlignItems: "SPACE_BETWEEN"` | | `justify-content` | `space-between` |
| `counterAxisAlignItems: "MIN"` | | `align-items` | `flex-start` |
| `counterAxisAlignItems: "CENTER"` | | `align-items` | `center` |
| `counterAxisAlignItems: "MAX"` | | `align-items` | `flex-end` |

### Child Layout Properties (when inside a flex container)

| Figma Property | CSS Property | Value |
|---|---|---|
| `layoutAlign: "STRETCH"` | `align-self` | `stretch` |
| `layoutGrow: 1` | `flex-grow` | `1` |

## Fills (Colors & Gradients)

### Solid Colors
- **Background**: `fills[0].type === "SOLID"` → `background-color: rgba(r*255, g*255, b*255, a*opacity)`
- **Text color**: Same formula but property is `color`
- Figma colors are 0–1 floats. Multiply r/g/b by 255, round.
- Alpha = `color.a * fill.opacity`. If alpha is 1, use `rgb()` instead of `rgba()`.

### Linear Gradients
- `fills[0].type === "GRADIENT_LINEAR"` → `background: linear-gradient({angle}deg, {stops})`
- Angle: `atan2(handle[1].y - handle[0].y, handle[1].x - handle[0].x) * 180 / PI + 90`
- Stops: `rgba(...) {position * 100}%` comma-separated

### Not Yet Mapped
- Radial, angular, diamond gradients
- Image fills (use asset_tool + get_design_context asset URLs)
- Multiple fills (only first fill is used currently)

## Typography

| Figma Property | CSS Property | Value |
|---|---|---|
| `style.fontFamily` | `font-family` | `"{family}", sans-serif` |
| `style.fontSize` | `font-size` | `{value}px` |
| `style.fontWeight` | `font-weight` | `{value}` |
| `style.lineHeightUnit: "PIXELS"` | `line-height` | `{lineHeightPx}px` |
| `style.lineHeightUnit: "FONT_SIZE_%"` | `line-height` | `{lineHeightPercent}%` |
| `style.lineHeightUnit: "AUTO"` | (omit) | browser default |
| `style.letterSpacing` | `letter-spacing` | `{value}px` |
| `style.textAlignHorizontal: "LEFT"` | `text-align` | `left` |
| `style.textAlignHorizontal: "CENTER"` | `text-align` | `center` |
| `style.textAlignHorizontal: "RIGHT"` | `text-align` | `right` |
| `style.textAlignHorizontal: "JUSTIFIED"` | `text-align` | `justify` |
| `style.textCase: "UPPER"` | `text-transform` | `uppercase` |
| `style.textCase: "LOWER"` | `text-transform` | `lowercase` |
| `style.textCase: "TITLE"` | `text-transform` | `capitalize` |
| `style.textDecoration: "UNDERLINE"` | `text-decoration` | `underline` |
| `style.textDecoration: "STRIKETHROUGH"` | `text-decoration` | `line-through` |

### Tag Inference for Text Nodes
1. Check layer name hints: "h1"/"heading 1" → h1, "h2"/"heading 2" → h2, etc.
2. Check for "paragraph"/"body" → p
3. Fallback by font size: >=40px → h1, >=32px → h2, >=24px → h3, >=20px → h4, else → p

## Geometry

| Figma Property | Condition | CSS Property | Value |
|---|---|---|---|
| `absoluteBoundingBox.width` | not layoutGrow=1, not STRETCH | `width` | `{round(value)}px` |
| `absoluteBoundingBox.height` | not layoutGrow=1, not STRETCH | `height` | `{round(value)}px` |
| `rectangleCornerRadii: [tl,tr,br,bl]` | all same, > 0 | `border-radius` | `{tl}px` |
| `rectangleCornerRadii: [tl,tr,br,bl]` | different | `border-radius` | `{tl}px {tr}px {br}px {bl}px` |
| `cornerRadius` | fallback, > 0 | `border-radius` | `{value}px` |
| ELLIPSE node type | always | `border-radius` | `50%` |
| `opacity` | < 1 | `opacity` | `{value}` |
| `clipsContent: true` | | `overflow` | `hidden` |

### Smart Sizing Logic
- If `layoutGrow === 1`: skip width (fills container on primary axis)
- If `layoutAlign === "STRETCH"`: skip cross-axis dimension, but still set primary axis width
- Otherwise: set both width and height from absoluteBoundingBox

## Effects

| Figma Effect Type | CSS Property | Value |
|---|---|---|
| `DROP_SHADOW` | `box-shadow` | `{x}px {y}px {blur}px {spread}px {rgba}` |
| `INNER_SHADOW` | `box-shadow` | `inset {x}px {y}px {blur}px {spread}px {rgba}` |
| `LAYER_BLUR` | `filter` | `blur({radius}px)` |
| `BACKGROUND_BLUR` | `backdrop-filter` | `blur({radius}px)` |

- Multiple shadows: comma-separated in one `box-shadow` value
- Multiple filters: space-separated in one `filter` value
- Only visible effects are included (`effect.visible !== false`)

## Not Yet Mapped (Handle Directly)

| Figma Property | CSS Translation |
|---|---|
| `strokes` + `strokeWeight` | `border: {weight}px solid {color}` |
| `layoutPositioning: "ABSOLUTE"` | `position: absolute` + x/y from bounding box |
| Image fills (`fills[].type: "IMAGE"`) | Upload via asset_tool, reference by ID |
| `constraints` | Map to responsive hints (min-width, max-width, %) |
| Mixed text styles (`characterStyleOverrides`) | Multiple inline spans or Webflow RichText |
| Rotation/transforms | `transform: rotate({deg}deg)` |
