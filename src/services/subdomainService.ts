// src/services/subdomainService.ts
import { AppDataSource } from "../config/data-source";
import { Tenant } from "../models/Tenant";
import { ApiError } from "../utils/ApiError";
import { RESERVED } from "../middleware/tenant";
import { Client } from "pg";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { SiteSetting } from "../models/SiteSetting";

function isValidSubdomain(candidate: string): boolean {
  // lowercase letters, numbers, and hyphens; cannot start/end with hyphen; length 1-50
  if (!candidate) return false;
  const s = candidate.trim().toLowerCase();
  if (s.length < 1 || s.length > 50) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s)) return false;
  return true;
}

/**
 * Provision a new tenant sub-domain record.
 * - Validates format
 * - Blocks reserved names (e.g., api, www, admin, auth) and "main"
 * - Errors if already exists
 */
export async function provisionSubdomain(domain: string) {
  const repo = AppDataSource.getRepository(Tenant);

  const normalized = (domain || "").trim().toLowerCase();
  if (!isValidSubdomain(normalized)) {
    throw new ApiError(
      400,
      "Subdomain format is invalid. Use only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen."
    );
  }
  if (
    normalized === "main" ||
    RESERVED.includes(normalized as (typeof RESERVED)[number])
  ) {
    throw new ApiError(
      400,
      `The subdomain "${normalized}" is reserved and cannot be used. Please choose a different name.`
    );
  }

  const existing = await repo.findOne({ where: { domain: normalized } });
  if (existing) {
    throw new ApiError(
      400,
      `The subdomain "${normalized}" is already taken. Please choose a different name.`
    );
  }

  const record = repo.create({ domain: normalized });
  await repo.save(record);

  // Create tenant schema and default SiteSetting row immediately
  try {
    const siteSettingRepo = await getRepositoryForTenant(
      SiteSetting,
      normalized
    );
    let existing = await siteSettingRepo.findOneBy({});
    if (!existing) {
      existing = siteSettingRepo.create({
        siteTitle: "مدونة الموقع",
        siteDescription: null,
        siteIconUrl: null,
        headerStyle: "gradient",
        headerColor: null,
      });
      await siteSettingRepo.save(existing);
    }
  } catch (e) {
    // Non-fatal; tenant created even if default settings could not be initialized
    console.error(
      "Failed to initialize default SiteSetting for tenant",
      normalized,
      e
    );
  }
  return record;
}

/**
 * Delete a tenant subdomain: drop its schema and remove the Tenant record.
 */
export async function deleteSubdomain(domain: string): Promise<void> {
  const repo = AppDataSource.getRepository(Tenant);
  const normalized = (domain || "").trim().toLowerCase();
  const existing = await repo.findOne({ where: { domain: normalized } });
  if (!existing) {
    throw new ApiError(404, "Tenant not found");
  }

  // Drop schema if exists
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${normalized}" CASCADE;`);
  } finally {
    await client.end();
  }

  await repo.delete({ id: existing.id });
}
