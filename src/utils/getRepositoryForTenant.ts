import { Repository, ObjectType, ObjectLiteral } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { getTenantDataSource } from "../config/tenantDataSource";

export async function getRepositoryForTenant<Entity extends ObjectLiteral>(
  entity: ObjectType<Entity>,
  tenant: string
): Promise<Repository<Entity>> {
    console.log("tenet",tenant);
  const dataSource = tenant === "main" ? AppDataSource : await getTenantDataSource(tenant);
  return dataSource.getRepository(entity);
}
