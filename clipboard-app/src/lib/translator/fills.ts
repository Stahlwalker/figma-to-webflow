import { FigmaNode, FigmaColor } from "../figma/types";

export function mapFills(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};
  const fills = (node.fills || []).filter((f) => f.visible !== false);

  if (fills.length === 0) return styles;

  const fill = fills[0];

  if (fill.type === "SOLID" && fill.color) {
    const opacity = fill.opacity ?? 1;
    styles["background-color"] = colorToRgba(fill.color, opacity);
  }

  if (
    fill.type === "GRADIENT_LINEAR" &&
    fill.gradientStops &&
    fill.gradientHandlePositions
  ) {
    const angle = computeGradientAngle(fill.gradientHandlePositions);
    const stops = fill.gradientStops
      .map(
        (s) =>
          `${colorToRgba(s.color, s.color.a)} ${Math.round(s.position * 100)}%`
      )
      .join(", ");
    styles["background"] = `linear-gradient(${angle}deg, ${stops})`;
  }

  return styles;
}

export function mapTextColor(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};
  const fills = (node.fills || []).filter((f) => f.visible !== false);

  if (fills.length > 0 && fills[0].type === "SOLID" && fills[0].color) {
    const opacity = fills[0].opacity ?? 1;
    styles["color"] = colorToRgba(fills[0].color, opacity);
  }

  return styles;
}

export function colorToRgba(color: FigmaColor, opacity = 1): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(color.a * opacity * 100) / 100;
  if (a === 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function computeGradientAngle(handles: { x: number; y: number }[]): number {
  if (handles.length < 2) return 180;
  const dx = handles[1].x - handles[0].x;
  const dy = handles[1].y - handles[0].y;
  return Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
}
