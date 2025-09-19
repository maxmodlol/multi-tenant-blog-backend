// src/services/adSettingService.ts

import { AdSetting, Placement, Appearance } from "../models/AdSetting";
import { ApiError } from "../utils/ApiError";
import { getMainRepository } from "../utils/getRepositoryForTenant";

/**
 * Create a new AdSetting, scoped to the blogId’s tenant behind the scenes.
 */
export async function createAdSetting(
  blogId: string,
  input: {
    placement: Placement;
    appearance: Appearance;
    codeSnippet: string;
    isEnabled?: boolean;
    positionOffset?: number;
  }
): Promise<AdSetting> {
  // getRepositoryForBlog should internally figure out which tenant/schema based on blogId
  const repo = await getMainRepository(AdSetting);
  const ad = repo.create({
    blogId,
    placement: input.placement,
    appearance: input.appearance,
    codeSnippet: input.codeSnippet,
    isEnabled: input.isEnabled ?? true,
    positionOffset: input.positionOffset,
  });
  return repo.save(ad);
}

/**
 * Fetch all AdSettings for a specific blogId.
 */
export async function getAdSettings(blogId: string): Promise<AdSetting[]> {
  const repo = await getMainRepository(AdSetting);
  if (!blogId) {
    throw new ApiError(400, "blogId query parameter is required");
  }

  // Find all ads for the given blogId
  const ads = (await repo.find({ where: { blogId } })) || [];

  return ads;
}

/**
 * Update an existing AdSetting by ID.
 * We need blogId only to locate the right repository/schema.
 */
export async function updateAdSetting(
  id: string,
  updates: Partial<{
    placement: Placement;
    appearance: Appearance;
    codeSnippet: string;
    isEnabled: boolean;
    positionOffset: number;
  }>
): Promise<AdSetting> {
  const repo = await getMainRepository(AdSetting);
  const ad = await repo.findOne({ where: { id } });
  if (!ad) throw new ApiError(404, "AdSetting not found");

  const merged = repo.merge(ad, updates);
  return repo.save(merged);
}

/**
 * Delete a single AdSetting by ID and blogId.
 */
export async function deleteAdSetting(
  blogId: string,
  id: string
): Promise<void> {
  const repo = await getMainRepository(AdSetting);
  const result = await repo.delete({ id, blogId });
  if (result.affected === 0) {
    throw new ApiError(404, "AdSetting not found");
  }
}
