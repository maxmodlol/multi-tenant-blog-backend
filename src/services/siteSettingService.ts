// src/services/siteSettingService.ts
import { SiteSetting } from "../models/SiteSetting";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { parseHslString, generateBrandScale } from "../utils/colorUtils";
import { ApiError } from "../utils/ApiError";

/* ----------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------*/
function validateHeaderStyle(
  style: unknown
): asserts style is "gradient" | "solid" {
  if (style !== "gradient" && style !== "solid") {
    throw new ApiError(400, "headerStyle must be 'gradient' or 'solid'");
  }
}

function validateHslOrThrow(value: string, fieldName: string) {
  try {
    parseHslString(value);
  } catch {
    throw new ApiError(400, `${fieldName} must be in "H S% L%" format`);
  }
}

/* ----------------------------------------------------------------
 * Public API
 * ----------------------------------------------------------------*/

/**
 * Fetch (or create default) the singleton SiteSetting for a tenant.
 */
export async function getOrCreateSiteSetting(tenant: string): Promise<{
  id: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  baseColor: string;
  brandScale: Record<string, string>;
  headerStyle: "gradient" | "solid";
  headerColor?: string | null;
}> {
  const repo = await getRepositoryForTenant(SiteSetting, tenant);

  /* Find or create the single row */
  let setting = await repo.findOneBy({});
  if (!setting) {
    setting = repo.create({
      headerStyle: "gradient", // <-- default
      headerColor: null,
    });
    setting = await repo.save(setting);
  }

  /* Derive brand scale */
  let brandScale: Record<string, string> = {};
  try {
    brandScale = generateBrandScale(parseHslString(setting.baseColor));
  } catch (err) {
    console.error("Error parsing baseColor:", err);
  }

  return {
    id: setting.id,
    logoLightUrl: setting.logoLightUrl || undefined,
    logoDarkUrl: setting.logoDarkUrl || undefined,
    baseColor: setting.baseColor,
    brandScale,
    headerStyle: setting.headerStyle,
    headerColor: setting.headerColor,
  };
}

/**
 * Update an existing SiteSetting.
 */
export async function updateSiteSetting(
  tenant: string,
  id: string,
  updates: Partial<{
    logoLightUrl: string;
    logoDarkUrl: string;
    baseColor: string;
    headerStyle: "gradient" | "solid";
    headerColor: string | null;
  }>
): Promise<{
  id: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  baseColor: string;
  brandScale: Record<string, string>;
  headerStyle: "gradient" | "solid";
  headerColor?: string | null;
}> {
  const repo = await getRepositoryForTenant(SiteSetting, tenant);
  console.log("update", updates.headerColor, updates.headerStyle, updates);
  const existing = await repo.findOneBy({ id });
  if (!existing) throw new ApiError(404, "SiteSetting not found");

  /* Validation -------------------------------------------------- */
  if (updates.baseColor) validateHslOrThrow(updates.baseColor, "baseColor");
  if (updates.headerStyle) validateHeaderStyle(updates.headerStyle);

  if (updates.headerStyle === "solid") {
    // If switching to solid, a colour *must* be supplied or pre-exist
    const color = updates.headerColor ?? existing.headerColor;
    if (!color)
      throw new ApiError(
        400,
        "headerColor required when headerStyle is 'solid'"
      );
    validateHslOrThrow(color, "headerColor");
  }

  if (updates.headerColor) {
    validateHslOrThrow(updates.headerColor, "headerColor");
  }

  /* Persist ----------------------------------------------------- */
  const merged = repo.merge(existing, updates);
  const saved = await repo.save(merged);

  /* Re-generate brand scale if baseColor changed ---------------- */
  let brandScale: Record<string, string> = {};
  try {
    brandScale = generateBrandScale(parseHslString(saved.baseColor));
  } catch {
    /* ignore */
  }

  return {
    id: saved.id,
    logoLightUrl: saved.logoLightUrl,
    logoDarkUrl: saved.logoDarkUrl,
    baseColor: saved.baseColor,
    brandScale,
    headerStyle: saved.headerStyle,
    headerColor: saved.headerColor,
  };
}
