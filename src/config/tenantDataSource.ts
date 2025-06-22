import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Blog } from "../models/Blog";
import { BlogPage } from "../models/BlogPage";
import { Category } from "../models/Category";
import { Client } from "pg";
import { SiteSetting } from "../models/SiteSetting";

// In-memory cache for tenant DataSources
const tenantDataSources: Record<string, DataSource> = {};

/**
 * Ensures that a given schema exists.
 * @param tenant The schema name to create.
 */
async function createSchemaIfNotExists(tenant: string): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenant}"`);
  await client.end();
}

/**
 * Returns a DataSource configured to use the given tenant schema.
 * @param tenant The tenant identifier (e.g., subdomain).
 */
export async function getTenantDataSource(tenant: string): Promise<DataSource> {
  if (tenant === "main") {
    throw new Error("Tenant 'main' is reserved for global operations.");
  }

  if (tenantDataSources[tenant]) {
    return tenantDataSources[tenant];
  }

  // Ensure the tenant schema exists before creating the DataSource.
  await createSchemaIfNotExists(tenant);

  const tenantDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: tenant, // Use the tenant (subdomain) as the schema name
    entities: [Blog, BlogPage, Category, SiteSetting],
    synchronize: true, // For development; use migrations in production
    logging: false,
  });

  await tenantDataSource.initialize();
  tenantDataSources[tenant] = tenantDataSource;
  console.log(`Initialized DataSource for tenant: ${tenant}`);
  return tenantDataSource;
}
