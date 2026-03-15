# Attempts

1. **Claude Artifact** — Prototyped the Figma-to-CSS translation logic as a Claude artifact to test the mapping concept.
2. **Next.js Backend + Webflow Designer Extension** — Built a hybrid app where a Next.js server reads Figma via API and a Webflow Designer Extension writes elements via the Designer API. Worked but had UX friction (install, OAuth, multiple clicks).
3. **MCP Workflow (Claude Code + Figma MCP + Webflow MCP)** — Pivoted to pasting Figma URLs directly in Claude Code, reading designs via Figma MCP, and building in Webflow via Webflow MCP. No app needed but too much back-and-forth — every section required 3-5 rounds of build-snapshot-fix, and MCP tools had major gaps (no embeds, no assets, no delete).
4. **MCP Translation Server** — Documented packaging the translation engine as a standalone MCP server that any AI assistant (including Webflow's AI) could call to get Webflow-ready build specs from Figma URLs.
5. **Clipboard Import (XscpData)** — Documented generating Webflow's native clipboard JSON format from Figma designs so users can copy-paste directly into the Designer. Proven model (Relume, Flowbase, Mozaik use it). Not yet validated.
