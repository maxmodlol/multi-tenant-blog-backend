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
    scope?: string; // "main", "all", or specific tenant ID
    blogId?: string; // Only used for blog-specific placements
    positionOffset?: number; // For INLINE placement
    targetingRules?: {
      pageTypes?: string[];
      excludePageTypes?: string[];
      userRoles?: string[];
      deviceTypes?: string[];
    };
  }
): Promise<TenantAdSetting> {
  try {
    // Use the tenantId from input if provided, otherwise use the current tenant context
    const targetTenantId = input.tenantId || tenantId;

    // For main website ads, we'll store them with a special identifier
    const finalTenantId = targetTenantId === "main" ? "main" : targetTenantId;

    // Determine scope - default to "main" if not specified
    const scope = input.scope || "main";

    // Use the main AppDataSource instead of getRepositoryForTenant to avoid metadata issues
    const repo = AppDataSource.getRepository(TenantAdSetting);

    const ad = repo.create({
      tenantId: finalTenantId,
      placement: input.placement,
      appearance: input.appearance,
      codeSnippet: input.codeSnippet,
      isEnabled: input.isEnabled ?? true,
      priority: input.priority ?? 0,
      title: input.title,
      description: input.description,
      scope: scope,
      blogId: input.blogId,
      positionOffset: input.positionOffset,
      targetingRules: input.targetingRules,
    });

    const result = await repo.save(ad);
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all tenant ads for a specific tenant
 */
export async function getTenantAdSettings(
  tenantId: string
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
    // For dashboard, we need to get ads from all tenants
    // Since we're in the main context, we'll use the main AppDataSource
    const repo = AppDataSource.getRepository(TenantAdSetting);

    const result = await repo.find({
      order: { priority: "DESC", createdAt: "ASC" },
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Get tenant ads by placement (e.g., all HEADER ads)
 */
export async function getTenantAdsByPlacement(
  tenantId: string,
  placement: TenantAdPlacement
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
  pageType: string
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
  }>
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
  id: string
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
  blogId?: string
): Promise<Record<string, TenantAdSetting[]>> {
  const repo = AppDataSource.getRepository(TenantAdSetting);

  // Lookup tenant UUID from subdomain (e.g., "pub7" -> tenant UUID)
  let tenantUuid: string | null = null;
  if (tenantId !== "main") {
    const { Tenant } = await import("../models/Tenant");
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { domain: tenantId } });
    if (tenant) {
      tenantUuid = tenant.id;
    }
  }

  // Build query with scope logic:
  // 1. Global ads (scope = "all" or "global" or "Global") - show everywhere
  // 2. Main domain ads (scope = "main") - only show on main domain (tenantId = "main")
  // 3. Specific tenant ads (scope = tenant subdomain OR tenant UUID) - only show on that specific tenant
  let query = repo
    .createQueryBuilder("ad")
    .where("ad.isEnabled = :isEnabled", { isEnabled: true });

  // Build scope condition
  if (tenantId === "main") {
    query = query.andWhere(
      "(ad.scope IN ('all', 'global', 'Global') OR ad.scope = 'main')"
    );
  } else {
    // For subdomains, include global ads + tenant-specific ads (by subdomain OR UUID)
    if (tenantUuid) {
      query = query.andWhere(
        "(ad.scope IN ('all', 'global', 'Global') OR ad.scope = :tenantId OR ad.scope = :tenantUuid)",
        { tenantId, tenantUuid }
      );
    } else {
      query = query.andWhere(
        "(ad.scope IN ('all', 'global', 'Global') OR ad.scope = :tenantId)",
        { tenantId }
      );
    }
  }

  // For blog-specific ads, also check blogId
  if (blogId) {
    query = query.andWhere("(ad.blogId IS NULL OR ad.blogId = :blogId)", {
      blogId,
    });
  } else {
    // For site-wide pages, exclude blog-specific ads
    query = query.andWhere("ad.blogId IS NULL");
  }

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
