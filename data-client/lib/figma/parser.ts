import { FigmaNode, ParsedSection } from "./types";

export function parseSections(fileData: { document: FigmaNode }, targetNodeId?: string): ParsedSection[] {
  if (targetNodeId) {
    const node = findNode(fileData.document, targetNodeId);
    if (node) {
      const children = (node.children || []).filter(
        (child) => isFrameLike(child) && child.visible !== false
      );
      // If the node has frame-like children, return them as individual sections
      if (children.length > 0) {
        return children.map((child) => ({
          id: slugify(child.name),
          label: child.name,
          nodeId: child.id,
          width: child.absoluteBoundingBox?.width,
          height: child.absoluteBoundingBox?.height,
        }));
      }
      // Otherwise treat the node itself as the section
      if (isFrameLike(node)) {
        return [{
          id: slugify(node.name),
          label: node.name,
          nodeId: node.id,
          width: node.absoluteBoundingBox?.width,
          height: node.absoluteBoundingBox?.height,
        }];
      }
    }
  }

  // No target node — use first page's top-level frames
  const root = getFirstPage(fileData.document);
  if (!root) {
    throw new Error("Could not find page in Figma file");
  }

  const children = root.children || [];
  return children
    .filter((child) => isFrameLike(child) && child.visible !== false)
    .map((child) => ({
      id: slugify(child.name),
      label: child.name,
      nodeId: child.id,
      width: child.absoluteBoundingBox?.width,
      height: child.absoluteBoundingBox?.height,
    }));
}

function getFirstPage(document: FigmaNode): FigmaNode | null {
  if (document.type === "DOCUMENT" && document.children?.length) {
    return document.children[0]; // First CANVAS (page)
  }
  return document;
}

function findNode(node: FigmaNode, targetId: string): FigmaNode | null {
  if (node.id === targetId) return node;
  for (const child of node.children || []) {
    const found = findNode(child, targetId);
    if (found) return found;
  }
  return null;
}

function isFrameLike(node: FigmaNode): boolean {
  return ["FRAME", "COMPONENT", "COMPONENT_SET", "INSTANCE", "SECTION"].includes(node.type);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
