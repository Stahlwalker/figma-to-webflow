import type { BuildPlanNode } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWebflow(): any {
  const wf = (window as any).webflow;
  if (!wf) {
    throw new Error("Webflow Designer API not available");
  }
  return wf;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebflowStyle = any;

const createdStyles = new Map<string, WebflowStyle>();
let existingStylesByName: Map<string, WebflowStyle> | null = null;

async function loadExistingStyles(): Promise<Map<string, WebflowStyle>> {
  if (existingStylesByName) return existingStylesByName;

  const allStyles = await getWebflow().getAllStyles();
  const map = new Map<string, WebflowStyle>();
  for (const s of allStyles) {
    // getName() may be sync or async — await to be safe
    const name = await s.getName();
    map.set(name, s);
  }
  console.log(`[style-creator] Loaded ${map.size} existing styles from Webflow`);
  existingStylesByName = map;
  return map;
}

async function getOrCreateStyle(
  styleName: string,
  styles: Record<string, string>
): Promise<WebflowStyle> {
  // Check in-memory cache first
  if (createdStyles.has(styleName)) {
    return createdStyles.get(styleName)!;
  }

  // Check if it already exists in Webflow (from previous builds)
  const existing = await loadExistingStyles();
  const found = existing.get(styleName);
  if (found) {
    console.log(`[style-creator] Reusing existing style: "${styleName}"`);
    await found.setProperties(styles);
    createdStyles.set(styleName, found);
    return found;
  }

  // Create new style
  try {
    console.log(`[style-creator] Creating new style: "${styleName}"`);
    const style = await getWebflow().createStyle(styleName);
    await style.setProperties(styles);
    createdStyles.set(styleName, style);
    // Also add to existing cache so subsequent nodes with same name find it
    existing.set(styleName, style);
    return style;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("duplicate")) {
      console.warn(`[style-creator] Duplicate detected for "${styleName}", refreshing cache...`);
      // Force refresh the cache and retry
      existingStylesByName = null;
      const refreshed = await loadExistingStyles();
      const retryFound = refreshed.get(styleName);
      if (retryFound) {
        await retryFound.setProperties(styles);
        createdStyles.set(styleName, retryFound);
        return retryFound;
      }
    }
    throw err;
  }
}

export async function createAllStyles(
  plan: BuildPlanNode
): Promise<Map<string, WebflowStyle>> {
  const styleMap = new Map<string, WebflowStyle>();

  // Pre-load existing styles once
  await loadExistingStyles();

  async function walk(node: BuildPlanNode): Promise<void> {
    if (Object.keys(node.styles).length > 0) {
      const style = await getOrCreateStyle(node.styleName, node.styles);
      styleMap.set(node.figmaNodeId, style);
    }
    for (const child of node.children) {
      await walk(child);
    }
  }

  await walk(plan);
  return styleMap;
}

export function clearStyleCache(): void {
  createdStyles.clear();
  existingStylesByName = null;
}
