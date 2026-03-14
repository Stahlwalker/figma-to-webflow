import { FigmaNode, ParsedFont } from "./types";

export function extractFonts(node: FigmaNode): ParsedFont[] {
  const fontMap = new Map<string, Set<number>>();
  walkForFonts(node, fontMap);

  return Array.from(fontMap.entries()).map(([family, weights]) => ({
    family,
    weights: Array.from(weights).sort((a, b) => a - b),
  }));
}

function walkForFonts(node: FigmaNode, fontMap: Map<string, Set<number>>): void {
  if (node.type === "TEXT" && node.style) {
    addFont(fontMap, node.style.fontFamily, node.style.fontWeight);

    // Check style overrides for mixed-style text
    if (node.styleOverrideTable) {
      for (const override of Object.values(node.styleOverrideTable)) {
        if (override.fontFamily) {
          addFont(fontMap, override.fontFamily, override.fontWeight || 400);
        }
      }
    }
  }

  for (const child of node.children || []) {
    walkForFonts(child, fontMap);
  }
}

function addFont(fontMap: Map<string, Set<number>>, family: string, weight: number): void {
  if (!fontMap.has(family)) {
    fontMap.set(family, new Set());
  }
  fontMap.get(family)!.add(weight);
}
