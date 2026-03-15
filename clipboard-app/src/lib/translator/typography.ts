import { FigmaNode } from "../figma/types";

export function mapTypography(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};
  const s = node.style;
  if (!s) return styles;

  if (s.fontFamily) styles["font-family"] = `"${s.fontFamily}", sans-serif`;
  if (s.fontSize) styles["font-size"] = `${s.fontSize}px`;
  if (s.fontWeight) styles["font-weight"] = `${s.fontWeight}`;

  // Line height
  if (s.lineHeightUnit === "PIXELS" && s.lineHeightPx) {
    styles["line-height"] = `${s.lineHeightPx}px`;
  } else if (s.lineHeightUnit === "FONT_SIZE_%" && s.lineHeightPercent) {
    styles["line-height"] = `${Math.round(s.lineHeightPercent)}%`;
  }

  if (s.letterSpacing) {
    styles["letter-spacing"] = `${s.letterSpacing}px`;
  }

  switch (s.textAlignHorizontal) {
    case "LEFT":
      styles["text-align"] = "left";
      break;
    case "CENTER":
      styles["text-align"] = "center";
      break;
    case "RIGHT":
      styles["text-align"] = "right";
      break;
    case "JUSTIFIED":
      styles["text-align"] = "justify";
      break;
  }

  switch (s.textCase) {
    case "UPPER":
      styles["text-transform"] = "uppercase";
      break;
    case "LOWER":
      styles["text-transform"] = "lowercase";
      break;
    case "TITLE":
      styles["text-transform"] = "capitalize";
      break;
  }

  switch (s.textDecoration) {
    case "UNDERLINE":
      styles["text-decoration"] = "underline";
      break;
    case "STRIKETHROUGH":
      styles["text-decoration"] = "line-through";
      break;
  }

  return styles;
}

export function inferTag(node: FigmaNode): string {
  if (node.type !== "TEXT") return "div";

  const fontSize = node.style?.fontSize || 16;
  const name = node.name.toLowerCase();

  if (name.includes("h1") || name.includes("heading 1")) return "h1";
  if (name.includes("h2") || name.includes("heading 2")) return "h2";
  if (name.includes("h3") || name.includes("heading 3")) return "h3";
  if (name.includes("h4") || name.includes("heading 4")) return "h4";
  if (name.includes("h5") || name.includes("heading 5")) return "h5";
  if (name.includes("h6") || name.includes("heading 6")) return "h6";
  if (name.includes("paragraph") || name.includes("body")) return "p";

  if (fontSize >= 40) return "h1";
  if (fontSize >= 32) return "h2";
  if (fontSize >= 24) return "h3";
  if (fontSize >= 20) return "h4";
  return "p";
}
