/**
 * Converts a CSS properties object into Webflow's `styleLess` format.
 *
 * Webflow's styleLess is a semicolon-separated string of long-form CSS properties.
 * Shorthand properties like `padding` must be expanded to individual properties.
 */
export function toStyleLess(styles: Record<string, string>): string {
  const expanded = expandShorthands(styles);
  const parts = Object.entries(expanded)
    .map(([prop, value]) => `${prop}: ${value}`);
  return parts.length > 0 ? parts.join("; ") + ";" : "";
}

/**
 * Expand CSS shorthand properties into long-form equivalents.
 * Webflow rejects shorthand — must use padding-top, not padding, etc.
 */
function expandShorthands(
  styles: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [prop, value] of Object.entries(styles)) {
    if (prop === "padding") {
      const parts = value.split(/\s+/);
      if (parts.length === 1) {
        result["padding-top"] = parts[0];
        result["padding-right"] = parts[0];
        result["padding-bottom"] = parts[0];
        result["padding-left"] = parts[0];
      } else if (parts.length === 2) {
        result["padding-top"] = parts[0];
        result["padding-right"] = parts[1];
        result["padding-bottom"] = parts[0];
        result["padding-left"] = parts[1];
      } else if (parts.length === 3) {
        result["padding-top"] = parts[0];
        result["padding-right"] = parts[1];
        result["padding-bottom"] = parts[2];
        result["padding-left"] = parts[1];
      } else if (parts.length === 4) {
        result["padding-top"] = parts[0];
        result["padding-right"] = parts[1];
        result["padding-bottom"] = parts[2];
        result["padding-left"] = parts[3];
      }
    } else if (prop === "margin") {
      const parts = value.split(/\s+/);
      if (parts.length === 1) {
        result["margin-top"] = parts[0];
        result["margin-right"] = parts[0];
        result["margin-bottom"] = parts[0];
        result["margin-left"] = parts[0];
      } else if (parts.length === 2) {
        result["margin-top"] = parts[0];
        result["margin-right"] = parts[1];
        result["margin-bottom"] = parts[0];
        result["margin-left"] = parts[1];
      } else if (parts.length === 4) {
        result["margin-top"] = parts[0];
        result["margin-right"] = parts[1];
        result["margin-bottom"] = parts[2];
        result["margin-left"] = parts[3];
      }
    } else if (prop === "border-radius") {
      // Webflow accepts border-radius as-is in styleLess
      result[prop] = value;
    } else {
      result[prop] = value;
    }
  }

  return result;
}
