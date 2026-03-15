import { FigmaNode } from "../figma/types";
import { WebflowBuildPlan, LayoutContext } from "./types";
import { mapAutoLayout, mapChildLayout, isAutoLayout } from "./layout";
import { mapFills, mapTextColor } from "./fills";
import { mapTypography, inferTag } from "./typography";
import { mapEffects } from "./effects";
import { mapGeometry } from "./geometry";
import { mapStrokes } from "./strokes";

export function mapFigmaToWebflow(node: FigmaNode): WebflowBuildPlan {
  return mapNode(node, { parentLayout: "NONE", isRoot: true });
}

function mapNode(node: FigmaNode, ctx: LayoutContext): WebflowBuildPlan {
  if (node.visible === false) {
    return createPlaceholder(node);
  }

  switch (node.type) {
    case "TEXT":
      return mapTextNode(node, ctx);
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
    case "SECTION":
    case "GROUP":
      return mapFrameNode(node, ctx);
    case "RECTANGLE":
    case "ELLIPSE":
    case "LINE":
      return mapShapeNode(node, ctx);
    case "VECTOR":
    case "BOOLEAN_OPERATION":
      return mapUnsupported(node, ctx);
    default:
      return mapFrameNode(node, ctx);
  }
}

function mapTextNode(node: FigmaNode, ctx: LayoutContext): WebflowBuildPlan {
  const tag = inferTag(node);
  const styles: Record<string, string> = {};

  Object.assign(styles, mapTypography(node));
  Object.assign(styles, mapTextColor(node));
  Object.assign(styles, mapGeometry(node, ctx.parentLayout !== "NONE"));

  if (ctx.parentLayout !== "NONE") {
    Object.assign(styles, mapChildLayout(node));
  }

  // Clean text content — strip Figma text style prefixes like "Body 4 — "
  let text = node.characters || "";
  const stylePrefixMatch = text.match(/^[A-Z][a-z]+ \d+ — /);
  if (stylePrefixMatch) {
    text = text.slice(stylePrefixMatch[0].length);
  }

  return {
    tag,
    preset: tag.startsWith("h") ? "Heading" : "Paragraph",
    styleName: generateStyleName(node),
    styles,
    textContent: text,
    children: [],
    figmaNodeId: node.id,
    figmaNodeName: node.name,
  };
}

function mapFrameNode(node: FigmaNode, ctx: LayoutContext): WebflowBuildPlan {
  const styles: Record<string, string> = {};
  // The root node or any SECTION should be treated as full-width
  const isSection = ctx.isRoot || node.type === "SECTION";

  if (isAutoLayout(node)) {
    Object.assign(styles, mapAutoLayout(node));
  }

  Object.assign(styles, mapFills(node));
  Object.assign(styles, mapEffects(node));
  Object.assign(styles, mapGeometry(node, ctx.parentLayout !== "NONE", isSection));
  Object.assign(styles, mapStrokes(node));

  if (ctx.parentLayout !== "NONE") {
    Object.assign(styles, mapChildLayout(node));
  }

  const childCtx: LayoutContext = {
    parentLayout: isAutoLayout(node)
      ? (node.layoutMode as "HORIZONTAL" | "VERTICAL")
      : "NONE",
  };

  const children = (node.children || [])
    .filter((child) => child.visible !== false)
    .map((child) => mapNode(child, childCtx));

  return {
    tag: isSection ? "section" : "div",
    preset: isSection ? "Section" : "DivBlock",
    styleName: generateStyleName(node),
    styles,
    children,
    figmaNodeId: node.id,
    figmaNodeName: node.name,
  };
}

function mapShapeNode(node: FigmaNode, ctx: LayoutContext): WebflowBuildPlan {
  const styles: Record<string, string> = {};

  Object.assign(styles, mapFills(node));
  Object.assign(styles, mapEffects(node));
  Object.assign(styles, mapGeometry(node, ctx.parentLayout !== "NONE"));
  Object.assign(styles, mapStrokes(node));

  if (ctx.parentLayout !== "NONE") {
    Object.assign(styles, mapChildLayout(node));
  }

  if (node.type === "ELLIPSE") {
    styles["border-radius"] = "50%";
  }

  return {
    tag: "div",
    preset: "DivBlock",
    styleName: generateStyleName(node),
    styles,
    children: [],
    figmaNodeId: node.id,
    figmaNodeName: node.name,
  };
}

function mapUnsupported(
  node: FigmaNode,
  ctx: LayoutContext
): WebflowBuildPlan {
  const styles: Record<string, string> = {};
  Object.assign(styles, mapGeometry(node, ctx.parentLayout !== "NONE"));

  if (ctx.parentLayout !== "NONE") {
    Object.assign(styles, mapChildLayout(node));
  }

  return {
    tag: "div",
    preset: "DivBlock",
    styleName: generateStyleName(node),
    styles,
    children: [],
    figmaNodeId: node.id,
    figmaNodeName: node.name,
  };
}

function createPlaceholder(node: FigmaNode): WebflowBuildPlan {
  return {
    tag: "div",
    preset: "DivBlock",
    styleName: generateStyleName(node),
    styles: { display: "none" },
    children: [],
    figmaNodeId: node.id,
    figmaNodeName: node.name,
  };
}

function generateStyleName(node: FigmaNode): string {
  const base = node.name
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 40);
  const hash = shortHash(node.id);
  return `${base || "element"}-${hash}`;
}

function shortHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 5);
}
