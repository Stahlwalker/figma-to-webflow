# Improvements & Future Ideas

## Responsive Breakpoints
- Currently only building for `main` (desktop, 992px+) breakpoint
- Add responsive overrides for `medium` (tablet), `small` (mobile landscape), `tiny` (mobile portrait)
- Nav: hide links, show hamburger menu on mobile — hamburger interaction requires manual Webflow Designer work (MCP can't create click interactions)
- General: adjust padding, font sizes, stack layouts vertically on smaller screens
- Approach: either per-section as built, or full responsive pass after all desktop sections are done

## Image Asset Upload
- Webflow MCP `asset_tool` has no `createAsset` action — images must be uploaded manually to the asset panel
- Blocks automation for logos, icons, photos
- Workaround: create properly sized Image placeholder elements, user drags asset in manually
- Ideal: Webflow exposes `createAsset` via MCP, or use Webflow Data API with API token as fallback

## Element Deletion
- No delete/remove element action in current Webflow MCP tools
- Broken elements can't be removed, only hidden via `display: none`
- Workaround: use CSS `order` or `display: none` to hide mistakes
