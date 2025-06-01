// src/services/subdomainService.ts
import { AppDataSource } from "../config/data-source";
import { Tenant } from "../models/Tenant";

/**
 * Locally record a new tenant domain.
 * (Stub for real DNS provisioning later.)
 */
export async function provisionSubdomain(domain: string) {
  const repo = AppDataSource.getRepository(Tenant);
  let t = await repo.findOne({ where: { domain } });
  if (!t) {
    t = repo.create({ domain });
    await repo.save(t);
  }
  return t;
}
