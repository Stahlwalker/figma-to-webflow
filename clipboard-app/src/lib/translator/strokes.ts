import { FigmaNode } from "../figma/types";
import { colorToRgba } from "./fills";

export function mapStrokes(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};
  const strokes = (node.strokes || []).filter((s) => s.visible !== false);

  if (strokes.length === 0 || !node.strokeWeight) return styles;

  const stroke = strokes[0];
  if (stroke.type === "SOLID" && stroke.color) {
    const opacity = stroke.opacity ?? 1;
    styles["border-width"] = `${node.strokeWeight}px`;
    styles["border-style"] = "solid";
    styles["border-color"] = colorToRgba(stroke.color, opacity);
  }

  return styles;
}
