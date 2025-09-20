import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTenantAdSettingUnified1735000000000
  implements MigrationInterface
{
  name = "UpdateTenantAdSettingUnified1735000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to tenant_ad_setting table
    await queryRunner.query(`
      ALTER TABLE "tenant_ad_setting" 
      ADD COLUMN IF NOT EXISTS "scope" varchar(255) DEFAULT 'main'
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_ad_setting" 
      ADD COLUMN IF NOT EXISTS "blogId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_ad_setting" 
      ADD COLUMN IF NOT EXISTS "positionOffset" integer
    `);

    // Update placement enum to include blog-specific placements
    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'ABOVE_TAGS'
    `);

    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'UNDER_DATE'
    `);

    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'UNDER_SHARE_1'
    `);

    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'UNDER_SHARE_2'
    `);

    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'INLINE'
    `);

    // Create new indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenant_ad_setting_scope_placement" 
      ON "tenant_ad_setting" ("scope", "placement")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenant_ad_setting_blogId" 
      ON "tenant_ad_setting" ("blogId")
    `);

    // Update existing records to have proper scope
    await queryRunner.query(`
      UPDATE "tenant_ad_setting" 
      SET "scope" = "tenantId" 
      WHERE "scope" IS NULL OR "scope" = 'main'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_tenant_ad_setting_scope_placement"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_tenant_ad_setting_blogId"`
    );

    // Remove columns
    await queryRunner.query(
      `ALTER TABLE "tenant_ad_setting" DROP COLUMN IF EXISTS "scope"`
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_ad_setting" DROP COLUMN IF EXISTS "blogId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_ad_setting" DROP COLUMN IF EXISTS "positionOffset"`
    );

    // Note: We can't easily remove enum values, so we leave them for now
    // In production, you might want to create a new enum type and migrate data
  }
}


