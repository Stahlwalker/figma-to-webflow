import type { BuildPlanNode, BuildResult, BuildProgress } from "./types";
import { createAllStyles, clearStyleCache } from "./style-creator";

// The webflow global is injected by the Webflow Designer into the extension iframe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWebflow(): any {
  const wf = (window as any).webflow;
  if (!wf) {
    throw new Error(
      "Webflow Designer API not available. Make sure the extension is running inside the Webflow Designer."
    );
  }
  return wf;
}

function countNodes(plan: BuildPlanNode): number {
  let count = 1;
  for (const child of plan.children) {
    count += countNodes(child);
  }
  return count;
}

// Create elements one-at-a-time using element.append(preset)
// This avoids the elementBuilder API which has issues with the DOM preset
async function createElementTree(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parent: any,
  plan: BuildPlanNode,
  styleMap: Map<string, unknown>,
  onProgress?: (name: string) => void
): Promise<void> {
  const wf = getWebflow();

  // Choose preset based on tag
  // DivBlock is the safest general-purpose container
  const preset = wf.elementPresets.DivBlock;

  // Create and insert element as last child of parent
  console.log(`[createElementTree] Appending "${plan.figmaNodeName}" (tag: ${plan.tag}), parent.append: ${typeof parent.append}`);
  if (typeof parent.append !== "function") {
    console.warn(`[createElementTree] parent does not have append for "${plan.figmaNodeName}", skipping`);
    onProgress?.(plan.figmaNodeName);
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element: any = await parent.append(preset);

  if (!element) {
    console.warn(`[createElementTree] Failed to create element for ${plan.figmaNodeName}`);
    return;
  }

  // Apply style first (before text or children)
  const style = styleMap.get(plan.figmaNodeId);
  if (style) {
    try {
      await element.setStyles([style]);
    } catch (err) {
      console.warn(`[createElementTree] Failed to apply style to ${plan.figmaNodeName}:`, err);
    }
  }

  // Recursively create children BEFORE setting text
  // (setTextContent may convert the element to text-only, losing append)
  if (plan.children.length > 0) {
    for (const child of plan.children) {
      try {
        await createElementTree(element, child, styleMap, onProgress);
      } catch (err) {
        console.warn(`[createElementTree] Failed to create child of ${plan.figmaNodeName}:`, err);
      }
    }
  }

  // Set text content LAST and only on leaf nodes (no children)
  if (plan.textContent && plan.children.length === 0) {
    try {
      await element.setTextContent(plan.textContent);
    } catch (err) {
      console.warn(`[createElementTree] Failed to set text for ${plan.figmaNodeName}:`, err);
    }
  }

  onProgress?.(plan.figmaNodeName);
}

export async function buildSection(
  plan: BuildPlanNode,
  onProgress?: (progress: BuildProgress) => void
): Promise<BuildResult> {
  const totalNodes = countNodes(plan);
  const errors: string[] = [];
  let completed = 0;

  const updateProgress = (current: string) => {
    completed++;
    onProgress?.({
      status: "building",
      current,
      total: totalNodes,
      completed,
      errors,
    });
  };

  clearStyleCache();

  try {
    onProgress?.({
      status: "building",
      current: "Creating styles...",
      total: totalNodes,
      completed: 0,
      errors: [],
    });

    // Step 1: Create all styles upfront
    const styleMap = await createAllStyles(plan);

    onProgress?.({
      status: "building",
      current: "Creating elements...",
      total: totalNodes,
      completed: 0,
      errors: [],
    });

    // Step 2: Get insertion target — always use body (root) for sections
    const wf = getWebflow();
    const target = await wf.getRootElement();

    if (!target) {
      throw new Error("No root element found. Ensure the page has a body.");
    }

    console.log("[buildSection] target:", target);
    console.log("[buildSection] target.append:", typeof target.append);
    console.log("[buildSection] target.children:", target.children);

    if (typeof target.append !== "function") {
      throw new Error(`Root element does not support append (type: ${typeof target.append}). Try selecting a different element.`);
    }

    // Step 3: Create elements one-by-one, applying styles as we go
    await createElementTree(target, plan, styleMap, updateProgress);

    onProgress?.({
      status: "done",
      current: "Complete",
      total: totalNodes,
      completed: totalNodes,
      errors,
    });

    return {
      success: true,
      elementsCreated: totalNodes,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    errors.push(msg);

    onProgress?.({
      status: "error",
      current: msg,
      total: totalNodes,
      completed,
      errors,
    });

    return {
      success: false,
      elementsCreated: completed,
      errors,
    };
  }
}
