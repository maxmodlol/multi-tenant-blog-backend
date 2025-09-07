import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteMetaToSiteSetting1712760000002
  implements MigrationInterface
{
  name = "AddSiteMetaToSiteSetting1712760000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Try both common naming variants used by TypeORM (quoted class name vs snake_case)
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "SiteSetting" ADD COLUMN IF NOT EXISTS "siteTitle" varchar(120) NOT NULL DEFAULT 'مدونة الموقع'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "SiteSetting" ADD COLUMN IF NOT EXISTS "siteDescription" text`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "SiteSetting" ADD COLUMN IF NOT EXISTS "siteIconUrl" text`,
    );

    await queryRunner.query(
      `ALTER TABLE IF EXISTS "site_setting" ADD COLUMN IF NOT EXISTS "siteTitle" varchar(120) NOT NULL DEFAULT 'مدونة الموقع'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "site_setting" ADD COLUMN IF NOT EXISTS "siteDescription" text`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "site_setting" ADD COLUMN IF NOT EXISTS "siteIconUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "SiteSetting" DROP COLUMN IF EXISTS "siteIconUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "SiteSetting" DROP COLUMN IF EXISTS "siteDescription"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "SiteSetting" DROP COLUMN IF EXISTS "siteTitle"`,
    );

    await queryRunner.query(
      `ALTER TABLE IF EXISTS "site_setting" DROP COLUMN IF EXISTS "siteIconUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "site_setting" DROP COLUMN IF EXISTS "siteDescription"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "site_setting" DROP COLUMN IF EXISTS "siteTitle"`,
    );
  }
}
