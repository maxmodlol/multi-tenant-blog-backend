// src/lib/colorUtils.ts

/**
 * Parse a string like "216 56% 45%" into { h: 216, s: 56, l: 45 }.
 * Assumes the input is exactly "H S% L%" (numbers and percent signs).
 */
export function parseHslString(hslString: string): {
  h: number;
  s: number;
  l: number;
} {
  const parts = hslString.trim().split(" ");
  if (parts.length !== 3) {
    throw new Error(`Invalid HSL format: ${hslString}`);
  }
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace("%", ""));
  const l = parseFloat(parts[2].replace("%", ""));
  if (isNaN(h) || isNaN(s) || isNaN(l)) {
    throw new Error(`Invalid HSL numbers: ${hslString}`);
  }
  return { h, s, l };
}

/**
 * Given a base HSL and a target “step index” from 100→900, return a new HSL string.
 * We define “500” as the base. Then we generate four steps lighter (100,200,300,400)
 * and four steps darker (600,700,800,900) by shifting lightness linearly.
 *
 * @param baseHsl  e.g. { h: 216, s: 56, l: 45 }
 * @param level    one of [100,200,300,400,500,600,700,800,900]
 * @returns        a string "H S% L%" for that shade
 */
export function generateBrandShade(
  baseHsl: { h: number; s: number; l: number },
  level: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
): string {
  const { h, s, l } = baseHsl;
  // Define how many steps above/below the base:
  // 100 => 4 steps lighter, 200 => 3 lighter, 300 => 2 lighter, 400 => 1 lighter,
  // 500 => exact base,
  // 600 => 1 darker, 700 => 2 darker, 800 => 3 darker, 900 => 4 darker.
  const stepIndex = level / 100 - 5; // 100→-4, 200→-3, ..., 500→0, 600→1 ... 900→4
  // Decide how many % points to adjust lightness per step. Let’s choose 7% per step:
  const stepSize = 7; // you can tweak this if you want a narrower/wider scale
  const newLightness = Math.min(100, Math.max(0, l - stepIndex * stepSize));
  // e.g. if base l=45, for level=100 (stepIndex=-4): l - (-4*7) => 45 + 28 => 73%
  // for level=900 (stepIndex=+4): 45 - (4*7) => 45 - 28 => 17%
  return `${h} ${s}% ${newLightness}%`;
}

/**
 * Generate an object { "100": "H S% L%", "200": "...", …, "900": "..." }
 * given a baseHsl.
 */
export function generateBrandScale(baseHsl: {
  h: number;
  s: number;
  l: number;
}) {
  const levels: (100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900)[] = [
    100, 200, 300, 400, 500, 600, 700, 800, 900,
  ];
  const result: Record<string, string> = {};
  for (const lvl of levels) {
    result[String(lvl)] = generateBrandShade(baseHsl, lvl);
  }
  return result;
}
