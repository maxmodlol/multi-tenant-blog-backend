import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { AdHeaderSetting } from "../models/AdHeaderSetting";

export async function getAdHeaderSetting(
  tenant: string
): Promise<AdHeaderSetting | null> {
  const repo = await getRepositoryForTenant(AdHeaderSetting, tenant);
  return repo.findOne({ where: { tenantId: tenant } });
}

export async function upsertAdHeaderSetting(
  tenant: string,
  input: { headerSnippet: string; isEnabled?: boolean }
): Promise<AdHeaderSetting> {
  const repo = await getRepositoryForTenant(AdHeaderSetting, tenant);
  let existing = await repo.findOne({ where: { tenantId: tenant } });
  if (existing) {
    existing.headerSnippet = input.headerSnippet;
    existing.isEnabled = input.isEnabled ?? existing.isEnabled;
    return repo.save(existing);
  } else {
    const newOne = repo.create({
      tenantId: tenant,
      headerSnippet: input.headerSnippet,
      isEnabled: input.isEnabled ?? true,
    });
    return repo.save(newOne);
  }
}
