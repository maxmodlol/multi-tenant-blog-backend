import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingAdColumns1735000000004 implements MigrationInterface {
  name = "AddMissingAdColumns1735000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check and add scope column if it doesn't exist
    const scopeColumnExists = await queryRunner.hasColumn(
      "tenant_ad_setting",
      "scope"
    );
    if (!scopeColumnExists) {
      await queryRunner.query(
        `ALTER TABLE "tenant_ad_setting" ADD "scope" character varying(255)`
      );
    }

    // Check and add blogId column if it doesn't exist
    const blogIdColumnExists = await queryRunner.hasColumn(
      "tenant_ad_setting",
      "blogId"
    );
    if (!blogIdColumnExists) {
      await queryRunner.query(
        `ALTER TABLE "tenant_ad_setting" ADD "blogId" character varying(255)`
      );
    }

    // Check and add positionOffset column if it doesn't exist
    const positionOffsetColumnExists = await queryRunner.hasColumn(
      "tenant_ad_setting",
      "positionOffset"
    );
    if (!positionOffsetColumnExists) {
      await queryRunner.query(
        `ALTER TABLE "tenant_ad_setting" ADD "positionOffset" integer`
      );
    }

    // Set default scope values for existing ads
    await queryRunner.query(
      `UPDATE "tenant_ad_setting" SET "scope" = 'main' WHERE "scope" IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_ad_setting" DROP COLUMN "positionOffset"`
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_ad_setting" DROP COLUMN "blogId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_ad_setting" DROP COLUMN "scope"`
    );
  }
}
