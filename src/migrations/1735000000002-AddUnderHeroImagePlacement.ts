import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnderHeroImagePlacement1735000000002
  implements MigrationInterface
{
  name = "AddUnderHeroImagePlacement1735000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new UNDER_HERO_IMAGE placement value to the enum
    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'UNDER_HERO_IMAGE'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    console.warn(
      "Cannot remove enum values in PostgreSQL. Manual intervention required."
    );
  }
}





