import { Repository, ObjectType, ObjectLiteral } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { getTenantDataSource } from "../config/tenantDataSource";

export async function getRepositoryForTenant<Entity extends ObjectLiteral>(
  entity: ObjectType<Entity>,
  tenant: string
): Promise<Repository<Entity>> {
  const dataSource =
    tenant === "main" ? AppDataSource : await getTenantDataSource(tenant);
  return dataSource.getRepository(entity);
}

// get main repository
export async function getMainRepository<Entity extends ObjectLiteral>(
  entity: ObjectType<Entity>
): Promise<Repository<Entity>> {
  return AppDataSource.getRepository(entity);
}
