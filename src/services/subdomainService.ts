// src/services/subdomainService.ts
import { AppDataSource } from "../config/data-source";
import { Tenant } from "../models/Tenant";
import { ApiError } from "../utils/ApiError";
import { RESERVED } from "../middleware/tenant";
import { Client } from "pg";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { SiteSetting } from "../models/SiteSetting";
import { Category } from "../models/Category";

function isValidSubdomain(candidate: string): boolean {
  // lowercase letters, numbers, and hyphens; cannot start/end with hyphen; length 1-50
  if (!candidate) return false;
  const s = candidate.trim().toLowerCase();
  if (s.length < 1 || s.length > 50) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s)) return false;
  return true;
}

/**
 * Clone site settings from main tenant to new tenant
 */
async function cloneSiteSettingsFromMain(newTenant: string): Promise<void> {
  try {
    // Get site settings from main tenant
    const mainSiteSettingRepo = await getRepositoryForTenant(
      SiteSetting,
      "main"
    );
    const mainSiteSetting = await mainSiteSettingRepo.findOneBy({});

    if (!mainSiteSetting) {
      console.warn("No site settings found in main tenant to clone");
      return;
    }

    // Create site settings for new tenant
    const newSiteSettingRepo = await getRepositoryForTenant(
      SiteSetting,
      newTenant
    );
    const newSiteSetting = newSiteSettingRepo.create({
      siteTitle: mainSiteSetting.siteTitle,
      siteDescription: mainSiteSetting.siteDescription,
      siteIconUrl: mainSiteSetting.siteIconUrl,
      logoLightUrl: mainSiteSetting.logoLightUrl,
      logoDarkUrl: mainSiteSetting.logoDarkUrl,
      baseColor: mainSiteSetting.baseColor,
      headerStyle: mainSiteSetting.headerStyle,
      headerColor: mainSiteSetting.headerColor,
    });

    await newSiteSettingRepo.save(newSiteSetting);
  } catch (error) {
    console.error(
      `Failed to clone site settings to tenant ${newTenant}:`,
      error
    );
    // Don't throw - this is not critical for tenant creation
  }
}

/**
 * Clone categories from main tenant to new tenant
 */
async function cloneCategoriesFromMain(newTenant: string): Promise<void> {
  try {
    // Get all categories from main tenant
    const mainCategoryRepo = await getRepositoryForTenant(Category, "main");
    const mainCategories = await mainCategoryRepo.find();

    if (mainCategories.length === 0) {
      console.warn("No categories found in main tenant to clone");
      return;
    }

    // Create categories for new tenant
    const newCategoryRepo = await getRepositoryForTenant(Category, newTenant);

    for (const mainCategory of mainCategories) {
      // Check if category already exists (shouldn't happen, but safety first)
      const existing = await newCategoryRepo.findOne({
        where: { name: mainCategory.name },
      });
      if (!existing) {
        const newCategory = newCategoryRepo.create({
          name: mainCategory.name,
        });
        await newCategoryRepo.save(newCategory);
      }
    }
  } catch (error) {
    console.error(`Failed to clone categories to tenant ${newTenant}:`, error);
    // Don't throw - this is not critical for tenant creation
  }
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

  // Create tenant schema and clone data from main tenant
  try {
    // Clone site settings from main tenant (includes logos, favicon, etc.)
    await cloneSiteSettingsFromMain(normalized);

    // Clone categories from main tenant
    await cloneCategoriesFromMain(normalized);

    console.log(
      `Successfully cloned main tenant data to new tenant: ${normalized}`
    );
  } catch (e) {
    // Non-fatal; tenant created even if cloning could not be completed
    console.error("Failed to clone main tenant data for tenant", normalized, e);
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
