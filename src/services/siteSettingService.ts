// src/services/siteSettingService.ts

import { SiteSetting } from "../models/SiteSetting";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { parseHslString, generateBrandScale } from "../utils/colorUtils";
import { ApiError } from "../utils/ApiError";

/**
 * Fetch (or create default) the singleton SiteSetting for a given tenant.
 */
export async function getOrCreateSiteSetting(tenant: string): Promise<{
  id: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  baseColor: string;
  brandScale: Record<string, string>;
}> {
  // 1) Get the tenant-specific repository
  const repo = await getRepositoryForTenant(SiteSetting, tenant);

  // 2) Attempt to find any existing row. Use findOneBy({}) instead of findOne({}).
  let setting = await repo.findOneBy({});
  if (!setting) {
    // If none exists, create a new default
    setting = repo.create({});
    setting = await repo.save(setting);
  }

  // 3) Generate the brandScale from baseColor
  let brandScale: Record<string, string> = {};
  try {
    const baseHsl = parseHslString(setting.baseColor);
    brandScale = generateBrandScale(baseHsl);
  } catch (e) {
    console.error("Error parsing baseColor:", e);
  }

  // 4) Return the DTO
  return {
    id: setting.id,
    logoLightUrl: setting.logoLightUrl || undefined,
    logoDarkUrl: setting.logoDarkUrl || undefined,
    baseColor: setting.baseColor,
    brandScale,
  };
}

/**
 * Update an existing SiteSetting (baseColor and/or logos).
 */
export async function updateSiteSetting(
  tenant: string,
  id: string,
  updates: Partial<{
    logoLightUrl: string;
    logoDarkUrl: string;
    baseColor: string;
  }>,
): Promise<{
  id: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  baseColor: string;
  brandScale: Record<string, string>;
}> {
  const repo = await getRepositoryForTenant(SiteSetting, tenant);

  // Find by id using findOneBy({ id })
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    throw new ApiError(404, "SiteSetting not found");
  }

  // If baseColor is provided, validate its HSL format
  if (updates.baseColor) {
    try {
      parseHslString(updates.baseColor);
    } catch {
      throw new ApiError(400, "baseColor must be in H S% L% format");
    }
  }

  const merged = repo.merge(existing, updates);
  const saved = await repo.save(merged);

  // Regenerate brandScale
  let brandScale: Record<string, string> = {};
  try {
    const baseHsl = parseHslString(saved.baseColor);
    brandScale = generateBrandScale(baseHsl);
  } catch {
    // ignore
  }

  return {
    id: saved.id,
    logoLightUrl: saved.logoLightUrl,
    logoDarkUrl: saved.logoDarkUrl,
    baseColor: saved.baseColor,
    brandScale,
  };
}
