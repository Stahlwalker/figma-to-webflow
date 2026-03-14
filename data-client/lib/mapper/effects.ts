import { FigmaNode } from "../figma/types";
import { colorToRgba } from "./fills";

export function mapEffects(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};
  const effects = (node.effects || []).filter((e) => e.visible !== false);

  if (effects.length === 0) return styles;

  const shadows: string[] = [];
  const filters: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case "DROP_SHADOW": {
        const x = effect.offset?.x ?? 0;
        const y = effect.offset?.y ?? 0;
        const blur = effect.radius || 0;
        const spread = effect.spread ?? 0;
        const color = effect.color
          ? colorToRgba(effect.color, effect.color.a)
          : "rgba(0, 0, 0, 0.25)";
        shadows.push(`${x}px ${y}px ${blur}px ${spread}px ${color}`);
        break;
      }
      case "INNER_SHADOW": {
        const x = effect.offset?.x ?? 0;
        const y = effect.offset?.y ?? 0;
        const blur = effect.radius || 0;
        const spread = effect.spread ?? 0;
        const color = effect.color
          ? colorToRgba(effect.color, effect.color.a)
          : "rgba(0, 0, 0, 0.25)";
        shadows.push(`inset ${x}px ${y}px ${blur}px ${spread}px ${color}`);
        break;
      }
      case "LAYER_BLUR": {
        filters.push(`blur(${effect.radius}px)`);
        break;
      }
      case "BACKGROUND_BLUR": {
        styles["backdrop-filter"] = `blur(${effect.radius}px)`;
        break;
      }
    }
  }

  if (shadows.length > 0) {
    styles["box-shadow"] = shadows.join(", ");
  }
  if (filters.length > 0) {
    styles["filter"] = filters.join(" ");
  }

  return styles;
}
