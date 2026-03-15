import { WebflowBuildPlan } from "../translator/types";
import { toStyleLess } from "./style-formatter";

/**
 * XscpData types — Webflow's native clipboard format.
 * Reverse-engineered from copying elements in the Webflow Designer.
 */
interface XscpNode {
  _id: string;
  tag?: string;
  classes?: string[];
  children: string[];
  type: string;
  data?: Record<string, unknown>;
  text?: boolean;
  v?: string;
}

interface XscpStyle {
  _id: string;
  fake: boolean;
  type: "class";
  name: string;
  namespace: string;
  comb: string;
  styleLess: string;
  variants: Record<string, unknown>;
  children: string[];
  createdBy: string;
  selector: null;
}

interface XscpData {
  type: "@webflow/XscpData";
  payload: {
    nodes: XscpNode[];
    styles: XscpStyle[];
    assets: unknown[];
    ix1: unknown[];
    ix2: {
      interactions: unknown[];
      events: unknown[];
      actionLists: unknown[];
    };
  };
  meta: Record<string, number>;
}

let idCounter = 0;

function generateId(): string {
  idCounter++;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}-${idCounter}`;
}

/**
 * Maps a WebflowBuildPlan preset to the XscpData node `type` field.
 */
function mapNodeType(preset: string): string {
  switch (preset) {
    case "Section":
      return "Section";
    case "Heading":
      return "Heading";
    case "Paragraph":
      return "Paragraph";
    case "DivBlock":
      return "Block";
    case "LinkBlock":
      return "Link";
    case "Image":
      return "Image";
    default:
      return "Block";
  }
}

/**
 * Convert a WebflowBuildPlan tree into Webflow's XscpData clipboard JSON.
 */
export function buildXscpData(plan: WebflowBuildPlan): XscpData {
  idCounter = 0;
  const nodes: XscpNode[] = [];
  const styles: XscpStyle[] = [];
  const styleMap = new Map<string, string>(); // styleName -> style _id

  function processNode(planNode: WebflowBuildPlan): string {
    const nodeId = generateId();
    const childIds: string[] = [];

    // Process children first
    for (const child of planNode.children) {
      const childId = processNode(child);
      childIds.push(childId);
    }

    // Create or reuse style
    let styleId = styleMap.get(planNode.styleName);
    if (!styleId) {
      styleId = generateId();
      styleMap.set(planNode.styleName, styleId);

      const styleLess = toStyleLess(planNode.styles);
      styles.push({
        _id: styleId,
        fake: false,
        type: "class",
        name: planNode.styleName,
        namespace: "",
        comb: "",
        styleLess,
        variants: {},
        children: [],
        createdBy: "figma-to-webflow",
        selector: null,
      });
    }

    // If this node has text content, create a separate text child node
    // Webflow stores text as: Parent (Heading/Paragraph) -> Child {text:true, v:"content"}
    if (planNode.textContent !== undefined) {
      const textNodeId = generateId();
      nodes.push({
        _id: textNodeId,
        type: "Block",
        children: [],
        text: true,
        v: planNode.textContent,
      });
      childIds.push(textNodeId);
    }

    // Build node data to match real Webflow clipboard format
    const nodeType = mapNodeType(planNode.preset);
    const data: Record<string, unknown> = {
      tag: planNode.tag,
      devlink: { runtimeProps: {}, slot: "" },
      displayName: "",
      attr: { id: "" },
      xattr: [],
      search: { exclude: false },
      visibility: {
        conditions: [],
        keepInHtml: { tag: "False", val: {} },
      },
    };

    // Section and container types get a grid field
    if (nodeType === "Section") {
      data.grid = { type: "section" };
    }

    const node: XscpNode = {
      _id: nodeId,
      tag: planNode.tag,
      classes: [styleId],
      children: childIds,
      type: nodeType,
      data,
    };

    nodes.push(node);
    return nodeId;
  }

  processNode(plan);

  return {
    type: "@webflow/XscpData",
    payload: {
      nodes,
      styles,
      assets: [],
      ix1: [],
      ix2: {
        interactions: [],
        events: [],
        actionLists: [],
      },
    },
    meta: {
      unlinkedSymbolCount: 0,
      droppedLinks: 0,
      dynBindRemovedCount: 0,
      dynListBindRemovedCount: 0,
      paginationRemovedCount: 0,
      universalBindingsRemovedCount: 0,
      codeComponentsRemovedCount: 0,
    },
  };
}

/**
 * Serialize XscpData to the clipboard-ready JSON string.
 */
export function serializeXscpData(data: XscpData): string {
  return JSON.stringify(data);
}
