import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTenantAdSetting1712760000003 implements MigrationInterface {
  name = "CreateTenantAdSetting1712760000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_ad_setting" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" varchar(255) NOT NULL,
        "placement" varchar(255) NOT NULL,
        "appearance" varchar(255) NOT NULL,
        "codeSnippet" text NOT NULL,
        "isEnabled" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "title" text,
        "description" text,
        "targetingRules" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_ad_setting_id" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenant_ad_setting_tenant_placement" 
      ON "tenant_ad_setting" ("tenantId", "placement");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenant_ad_setting_tenant_enabled" 
      ON "tenant_ad_setting" ("tenantId", "isEnabled");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_ad_setting"`);
  }
}

