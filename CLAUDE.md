# Figma to Webflow — MCP Workflow

Translates Figma designs into Webflow pages using MCP tools directly in Claude Code.
No app, no backend, no API keys beyond MCP auth.

## Required MCP Connections

- **Figma MCP**: get_metadata, get_design_context, get_screenshot
- **Webflow MCP**: element_builder, style_tool, element_tool, element_snapshot_tool, asset_tool, data_sites_tool, webflow_guide_tool

## Workflow

When the user pastes a Figma URL:

### Step 0: Site Setup (Once Per Site)
- Ensure the Webflow Designer MCP app is launched (special URL per site)
- Add font smoothing via `data_scripts_tool > add_inline_site_script`:
  ```js
  document.documentElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
  document.documentElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
  ```
  This makes browser font rendering match Figma. Fully automated, no manual steps.

### Step 0.5: Parse the URL
- Format: `figma.com/design/:fileKey/:fileName?node-id=:nodeId`
- Branch URLs: `figma.com/design/:fileKey/branch/:branchKey/:fileName` — use branchKey as fileKey
- Convert nodeId dashes to colons (URL `1-2` → API `1:2`)
- If no nodeId, use `0:1` for the full page

### Step 1: Read the Design
1. `get_metadata` — structural overview (node IDs, names, sizes)
2. `get_design_context` — generated code, screenshot, asset URLs
3. `get_screenshot` — visual reference

### Step 1.5: Check Fonts (Optional)
- `get_design_context` returns font info (family, weight, style) in its response
- List all required fonts and ask the user if they want to add them in Webflow site font settings
- Common sources: Google Fonts (built into Webflow), Adobe Fonts, or custom upload
- If a font isn't available, suggest a close substitute or skip font-family in styles
- This step is optional — build proceeds with or without fonts loaded
- If the user confirms fonts are available, include `font-family` in the styles

### Step 2: Create Styles First
- Use `style_tool > create_style` for each unique style BEFORE creating elements
- Use long-form CSS property names (see mcp-workflow/webflow-style-rules.md)
- Name styles as kebab-case from Figma layer names (e.g., "Hero Wrapper" → "hero-wrapper")

### Step 3: Create Elements (Batched)
- Use `element_builder` — max 3 levels deep per call
- First call: outermost levels (Section → wrapper → inner divs)
- Subsequent calls: use returned element IDs as parent_element_id for deeper children
- See mcp-workflow/depth-batching.md for the full strategy

### Step 4: Verify
- `element_snapshot_tool` — screenshot of what was built
- Compare to Figma screenshot from Step 1
- Fix with `element_tool` and `style_tool > update_style`

## Reference Docs

- `mcp-workflow/property-mappings.md` — Figma properties → CSS values
- `mcp-workflow/webflow-element-mapping.md` — Figma node types → Webflow elements
- `mcp-workflow/webflow-style-rules.md` — Webflow style constraints
- `mcp-workflow/depth-batching.md` — handling the 3-level element_builder limit

## Legacy Code

`data-client/` and `designer-extension/` contain the original hybrid app approach.
Preserved but not used in the MCP workflow. The mapper code in `data-client/lib/mapper/`
is the source of truth for the property mappings documented in `mcp-workflow/`.
