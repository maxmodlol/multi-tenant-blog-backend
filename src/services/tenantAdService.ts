// src/services/tenantAdService.ts

import {
  TenantAdSetting,
  TenantAdPlacement,
  TenantAdAppearance,
} from "../models/TenantAdSetting";
import { ApiError } from "../utils/ApiError";
// import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { AppDataSource } from "../config/data-source";

/**
 * Create a new tenant-level ad setting
 */
export async function createTenantAdSetting(
  tenantId: string,
  input: {
    tenantId: string; // "main" for main website, or actual tenant ID
    placement: TenantAdPlacement;
    appearance: TenantAdAppearance;
    codeSnippet: string;
    isEnabled?: boolean;
    priority?: number;
    title?: string;
    description?: string;
    targetingRules?: {
      pageTypes?: string[];
      excludePageTypes?: string[];
      userRoles?: string[];
      deviceTypes?: string[];
    };
  },
): Promise<TenantAdSetting> {
  try {
    console.log("🔍 createTenantAdSetting: Starting with:", {
      tenantId,
      input,
    });

    // Use the tenantId from input if provided, otherwise use the current tenant context
    const targetTenantId = input.tenantId || tenantId;
    console.log("🔍 createTenantAdSetting: Target tenant ID:", targetTenantId);

    // For main website ads, we'll store them with a special identifier
    const finalTenantId = targetTenantId === "main" ? "main" : targetTenantId;
    console.log("🔍 createTenantAdSetting: Final tenant ID:", finalTenantId);

    console.log(
      "🔍 createTenantAdSetting: Getting repository from main AppDataSource...",
    );
    // Use the main AppDataSource instead of getRepositoryForTenant to avoid metadata issues
    const repo = AppDataSource.getRepository(TenantAdSetting);
    console.log("🔍 createTenantAdSetting: Repository obtained");

    const ad = repo.create({
      tenantId: finalTenantId,
      placement: input.placement,
      appearance: input.appearance,
      codeSnippet: input.codeSnippet,
      isEnabled: input.isEnabled ?? true,
      priority: input.priority ?? 0,
      title: input.title,
      description: input.description,
      targetingRules: input.targetingRules,
    });
    console.log("🔍 createTenantAdSetting: Ad entity created");

    const result = await repo.save(ad);
    console.log("🔍 createTenantAdSetting: Ad saved successfully:", result.id);
    return result;
  } catch (error) {
    console.error("❌ createTenantAdSetting: Error occurred:", error);
    throw error;
  }
}

/**
 * Get all tenant ads for a specific tenant
 */
export async function getTenantAdSettings(
  tenantId: string,
): Promise<TenantAdSetting[]> {
  // Use the main AppDataSource for consistency
  const repo = AppDataSource.getRepository(TenantAdSetting);
  return repo.find({
    where: { tenantId },
    order: { priority: "DESC", createdAt: "ASC" },
  });
}

/**
 * Get ALL tenant ads (for dashboard - no tenant filtering)
 */
export async function getAllTenantAdSettings(): Promise<TenantAdSetting[]> {
  try {
    console.log("🔍 getAllTenantAdSettings: Starting...");

    // For dashboard, we need to get ads from all tenants
    // Since we're in the main context, we'll use the main AppDataSource
    console.log("🔍 getAllTenantAdSettings: Getting repository...");
    const repo = AppDataSource.getRepository(TenantAdSetting);
    console.log(
      "🔍 getAllTenantAdSettings: Repository obtained, executing query...",
    );

    const result = await repo.find({
      order: { priority: "DESC", createdAt: "ASC" },
    });

    console.log(
      "🔍 getAllTenantAdSettings: Query successful, found",
      result.length,
      "ads",
    );
    return result;
  } catch (error) {
    console.error("❌ getAllTenantAdSettings: Error occurred:", error);
    throw error;
  }
}

/**
 * Get tenant ads by placement (e.g., all HEADER ads)
 */
export async function getTenantAdsByPlacement(
  tenantId: string,
  placement: TenantAdPlacement,
): Promise<TenantAdSetting[]> {
  const repo = AppDataSource.getRepository(TenantAdSetting);
  return repo.find({
    where: { tenantId, placement, isEnabled: true },
    order: { priority: "DESC", createdAt: "ASC" },
  });
}

/**
 * Get tenant ads for a specific page type
 */
export async function getTenantAdsForPageType(
  tenantId: string,
  pageType: string,
): Promise<TenantAdSetting[]> {
  const repo = AppDataSource.getRepository(TenantAdSetting);

  // Get all enabled ads for the tenant
  const allAds = await repo.find({
    where: { tenantId, isEnabled: true },
    order: { priority: "DESC", createdAt: "ASC" },
  });

  // Filter by targeting rules
  return allAds.filter((ad) => {
    if (!ad.targetingRules) return true; // No targeting rules = show everywhere

    // Check if page type is excluded
    if (ad.targetingRules.excludePageTypes?.includes(pageType)) {
      return false;
    }

    // Check if page type is specifically targeted
    if (ad.targetingRules.pageTypes && ad.targetingRules.pageTypes.length > 0) {
      return ad.targetingRules.pageTypes.includes(pageType);
    }

    return true; // No specific targeting = show everywhere
  });
}

/**
 * Update an existing tenant ad setting
 */
export async function updateTenantAdSetting(
  tenantId: string,
  id: string,
  updates: Partial<{
    placement: TenantAdPlacement;
    appearance: TenantAdAppearance;
    codeSnippet: string;
    isEnabled: boolean;
    priority: number;
    title: string;
    description: string;
    targetingRules: {
      pageTypes?: string[];
      excludePageTypes?: string[];
      userRoles?: string[];
      deviceTypes?: string[];
    };
  }>,
): Promise<TenantAdSetting> {
  const repo = AppDataSource.getRepository(TenantAdSetting);
  const ad = await repo.findOne({ where: { id, tenantId } });

  if (!ad) throw new ApiError(404, "Tenant ad setting not found");

  const merged = repo.merge(ad, updates);
  return repo.save(merged);
}

/**
 * Delete a tenant ad setting
 */
export async function deleteTenantAdSetting(
  tenantId: string,
  id: string,
): Promise<void> {
  const repo = AppDataSource.getRepository(TenantAdSetting);
  const result = await repo.delete({ id, tenantId });

  if (result.affected === 0) {
    throw new ApiError(404, "Tenant ad setting not found");
  }
}

/**
 * Get ads for a specific page context (used by frontend)
 */
export async function getTenantAdsForPage(
  tenantId: string,
  pageType: string,
  placements?: TenantAdPlacement[],
): Promise<Record<string, TenantAdSetting[]>> {
  const repo = AppDataSource.getRepository(TenantAdSetting);

  let query = repo
    .createQueryBuilder("ad")
    .where("ad.tenantId = :tenantId", { tenantId })
    .andWhere("ad.isEnabled = :isEnabled", { isEnabled: true });

  if (placements && placements.length > 0) {
    query = query.andWhere("ad.placement IN (:...placements)", { placements });
  }

  const allAds = await query
    .orderBy("ad.priority", "DESC")
    .addOrderBy("ad.createdAt", "ASC")
    .getMany();

  // Group by placement and filter by targeting rules
  const adsByPlacement: Record<string, TenantAdSetting[]> = {};

  allAds.forEach((ad) => {
    if (!ad.targetingRules) {
      // No targeting rules = show everywhere
      if (!adsByPlacement[ad.placement]) {
        adsByPlacement[ad.placement] = [];
      }
      adsByPlacement[ad.placement].push(ad);
      return;
    }

    // Check if page type is excluded
    if (ad.targetingRules.excludePageTypes?.includes(pageType)) {
      return;
    }

    // Check if page type is specifically targeted
    if (ad.targetingRules.pageTypes && ad.targetingRules.pageTypes.length > 0) {
      if (!ad.targetingRules.pageTypes.includes(pageType)) {
        return;
      }
    }

    // Add to placement group
    if (!adsByPlacement[ad.placement]) {
      adsByPlacement[ad.placement] = [];
    }
    adsByPlacement[ad.placement].push(ad);
  });

  return adsByPlacement;
}
