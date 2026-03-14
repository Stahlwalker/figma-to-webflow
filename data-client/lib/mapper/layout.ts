import { FigmaNode } from "../figma/types";

export function mapAutoLayout(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!node.layoutMode || node.layoutMode === "NONE") return styles;

  styles["display"] = "flex";
  styles["flex-direction"] = node.layoutMode === "HORIZONTAL" ? "row" : "column";

  if (node.itemSpacing != null && node.itemSpacing > 0) {
    styles["gap"] = `${node.itemSpacing}px`;
  }

  if (node.layoutWrap === "WRAP") {
    styles["flex-wrap"] = "wrap";
    if (node.counterAxisSpacing != null && node.counterAxisSpacing > 0) {
      styles["row-gap"] = `${node.counterAxisSpacing}px`;
    }
  }

  // Padding
  const pt = node.paddingTop || 0;
  const pr = node.paddingRight || 0;
  const pb = node.paddingBottom || 0;
  const pl = node.paddingLeft || 0;
  if (pt || pr || pb || pl) {
    styles["padding"] = `${pt}px ${pr}px ${pb}px ${pl}px`;
  }

  // Main axis alignment
  switch (node.primaryAxisAlignItems) {
    case "MIN": styles["justify-content"] = "flex-start"; break;
    case "CENTER": styles["justify-content"] = "center"; break;
    case "MAX": styles["justify-content"] = "flex-end"; break;
    case "SPACE_BETWEEN": styles["justify-content"] = "space-between"; break;
  }

  // Cross axis alignment
  switch (node.counterAxisAlignItems) {
    case "MIN": styles["align-items"] = "flex-start"; break;
    case "CENTER": styles["align-items"] = "center"; break;
    case "MAX": styles["align-items"] = "flex-end"; break;
  }

  return styles;
}

export function mapChildLayout(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};

  if (node.layoutAlign === "STRETCH") {
    styles["align-self"] = "stretch";
  }

  if (node.layoutGrow === 1) {
    styles["flex-grow"] = "1";
  }

  return styles;
}

export function isAutoLayout(node: FigmaNode): boolean {
  return !!node.layoutMode && node.layoutMode !== "NONE";
}
