import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { AdSetting, Placement, Appearance } from "../models/AdSetting";

export async function createAdSetting(
  tenant: string,
  input: {
    blogId?: string;
    placement: Placement;
    appearance: Appearance;
    codeSnippet: string;
    isEnabled?: boolean;
    positionOffset?: number;
  }
): Promise<AdSetting> {
  const repo = await getRepositoryForTenant(AdSetting, tenant);
  const ad = repo.create({ ...input });
  return repo.save(ad);
}

export async function getAdSettings(
  tenant: string,
  blogId?: string
): Promise<AdSetting[]> {
  const repo = await getRepositoryForTenant(AdSetting, tenant);
  return repo.find({
    //   where: { tenantId: tenant, blogId: blogId ?? null },
    order: { createdAt: "DESC" },
  });
}

export async function updateAdSetting(
  tenant: string,
  id: string,
  updates: Partial<{
    blogId: string;
    placement: Placement;
    appearance: Appearance;
    codeSnippet: string;
    isEnabled: boolean;
    positionOffset: number;
  }>
): Promise<AdSetting> {
  const repo = await getRepositoryForTenant(AdSetting, tenant);
  let ad = await repo.findOne({ where: { id } });
  if (!ad) throw new Error("AdSetting not found");
  ad = repo.merge(ad, updates);
  return repo.save(ad);
}

export async function deleteAdSetting(
  tenant: string,
  id: string
): Promise<void> {
  const repo = await getRepositoryForTenant(AdSetting, tenant);
  await repo.delete({ id });
}
