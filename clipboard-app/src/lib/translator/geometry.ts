import { FigmaNode } from "../figma/types";

export function mapGeometry(
  node: FigmaNode,
  parentIsAutoLayout: boolean,
  isSection = false
): Record<string, string> {
  const styles: Record<string, string> = {};
  const box = node.absoluteBoundingBox;

  // Sections are naturally full-width in Webflow
  if (isSection) {
    styles["overflow"] = "hidden";
    return applyDecorations(node, styles);
  }

  if (!box) return applyDecorations(node, styles);

  const hSizing = node.layoutSizingHorizontal;
  const vSizing = node.layoutSizingVertical;
  const isContainer =
    node.type === "FRAME" ||
    node.type === "COMPONENT" ||
    node.type === "INSTANCE" ||
    node.type === "GROUP";

  // === Horizontal sizing ===
  if (hSizing === "FILL") {
    // Fill parent → flex-grow or width: 100%
    if (parentIsAutoLayout) {
      styles["flex-grow"] = "1";
      styles["flex-shrink"] = "1";
      styles["flex-basis"] = "0%";
    } else {
      styles["width"] = "100%";
    }
  } else if (hSizing === "HUG") {
    // Hug contents → auto width (no explicit width needed)
  } else if (hSizing === "FIXED") {
    const w = Math.round(box.width);
    if (isContainer && w > 600) {
      // Large containers: use max-width to prevent viewport overflow
      styles["max-width"] = `${w}px`;
      styles["width"] = "100%";
    } else {
      styles["width"] = `${w}px`;
    }
  } else {
    // Fallback for older API without layoutSizing properties
    if (node.layoutGrow === 1) {
      styles["flex-grow"] = "1";
      styles["flex-shrink"] = "1";
      styles["flex-basis"] = "0%";
    } else if (node.layoutAlign === "STRETCH") {
      styles["align-self"] = "stretch";
    } else if (node.type === "TEXT") {
      // Don't set fixed width on text — let it flow
      if (box.width > 100) {
        styles["max-width"] = `${Math.round(box.width)}px`;
      }
    } else {
      styles["width"] = `${Math.round(box.width)}px`;
    }
  }

  // === Vertical sizing ===
  if (vSizing === "FILL") {
    if (parentIsAutoLayout) {
      styles["flex-grow"] = "1";
      styles["flex-shrink"] = "1";
      styles["flex-basis"] = "0%";
    } else {
      styles["height"] = "100%";
    }
  } else if (vSizing === "HUG") {
    // Hug contents → auto height (no explicit height)
  } else if (vSizing === "FIXED") {
    styles["height"] = `${Math.round(box.height)}px`;
  } else {
    // Fallback: only set height on leaf shapes (not containers, not text)
    const isText = node.type === "TEXT";
    if (!isContainer && !isText) {
      styles["height"] = `${Math.round(box.height)}px`;
    }
  }

  // Min/max constraints
  if (node.minWidth != null && node.minWidth > 0) {
    styles["min-width"] = `${Math.round(node.minWidth)}px`;
  }
  if (node.maxWidth != null && node.maxWidth > 0) {
    styles["max-width"] = `${Math.round(node.maxWidth)}px`;
  }
  if (node.minHeight != null && node.minHeight > 0) {
    styles["min-height"] = `${Math.round(node.minHeight)}px`;
  }
  if (node.maxHeight != null && node.maxHeight > 0) {
    styles["max-height"] = `${Math.round(node.maxHeight)}px`;
  }

  return applyDecorations(node, styles);
}

function applyDecorations(
  node: FigmaNode,
  styles: Record<string, string>
): Record<string, string> {
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
