import { AppDataSource } from "../config/data-source";
import { Tenant } from "../models/Tenant";

export async function listTenants(): Promise<Tenant[]> {
  const repo = AppDataSource.getRepository(Tenant);
  return repo.find({ order: { domain: "ASC" } });
}

export async function findTenantByDomain(
  domain: string,
): Promise<Tenant | null> {
  const repo = AppDataSource.getRepository(Tenant);
  return repo.findOne({ where: { domain } });
}
