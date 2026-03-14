import { FigmaNode } from "../figma/types";

export function mapGeometry(
  node: FigmaNode,
  parentIsAutoLayout: boolean
): Record<string, string> {
  const styles: Record<string, string> = {};
  const box = node.absoluteBoundingBox;

  // Width and height
  if (box) {
    // In auto-layout, sizing depends on the parent's axis sizing modes
    // and the child's layoutGrow / layoutAlign properties
    if (node.layoutGrow === 1) {
      // Fill container on primary axis — don't set fixed dimension
    } else if (node.layoutAlign === "STRETCH") {
      // Stretch on cross axis — don't set fixed cross-axis dimension
      // But still set primary axis dimension if fixed
      if (parentIsAutoLayout) {
        styles["width"] = `${Math.round(box.width)}px`;
      }
    } else {
      styles["width"] = `${Math.round(box.width)}px`;
    }

    // Height: similar logic
    if (node.layoutGrow !== 1 && node.layoutAlign !== "STRETCH") {
      styles["height"] = `${Math.round(box.height)}px`;
    }
  }

  // Border radius
  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    if (tl === tr && tr === br && br === bl) {
      if (tl > 0) styles["border-radius"] = `${tl}px`;
    } else {
      styles["border-radius"] = `${tl}px ${tr}px ${br}px ${bl}px`;
    }
  } else if (node.cornerRadius && node.cornerRadius > 0) {
    styles["border-radius"] = `${node.cornerRadius}px`;
  }

  // Opacity
  if (node.opacity != null && node.opacity < 1) {
    styles["opacity"] = `${Math.round(node.opacity * 100) / 100}`;
  }

  // Overflow
  if (node.clipsContent) {
    styles["overflow"] = "hidden";
  }

  return styles;
}
