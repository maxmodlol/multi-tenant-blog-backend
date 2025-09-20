import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupOldAdPlacements1735000000003 implements MigrationInterface {
  name = "CleanupOldAdPlacements1735000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, delete any records with old placement values that no longer exist
    await queryRunner.query(`
      DELETE FROM tenant_ad_setting 
      WHERE placement IN ('UNDER_SHARE_1', 'UNDER_SHARE_2')
    `);

    // Now we can safely update the enum to remove the old values
    // Note: PostgreSQL doesn't support removing enum values directly,
    // so we need to recreate the enum type

    // Create a new enum type without the old values
    await queryRunner.query(`
      CREATE TYPE tenant_ad_setting_placement_enum_new AS ENUM (
        'HEADER', 'FOOTER', 'SIDEBAR', 'HOME_HERO', 'HOME_BELOW_HERO',
        'CATEGORY_TOP', 'CATEGORY_BOTTOM', 'SEARCH_TOP', 'SEARCH_BOTTOM',
        'BLOG_LIST_TOP', 'BLOG_LIST_BOTTOM', 'ABOVE_TAGS', 'UNDER_DATE',
        'UNDER_HERO', 'UNDER_HERO_IMAGE', 'ABOVE_SHAREABLE', 'UNDER_SHAREABLE', 'INLINE'
      )
    `);

    // Update the column to use the new enum type
    await queryRunner.query(`
      ALTER TABLE tenant_ad_setting 
      ALTER COLUMN placement TYPE tenant_ad_setting_placement_enum_new 
      USING placement::text::tenant_ad_setting_placement_enum_new
    `);

    // Drop the old enum type
    await queryRunner.query(`
      DROP TYPE tenant_ad_setting_placement_enum
    `);

    // Rename the new enum type to the original name
    await queryRunner.query(`
      ALTER TYPE tenant_ad_setting_placement_enum_new 
      RENAME TO tenant_ad_setting_placement_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the old enum type with the removed values
    await queryRunner.query(`
      CREATE TYPE tenant_ad_setting_placement_enum_old AS ENUM (
        'HEADER', 'FOOTER', 'SIDEBAR', 'HOME_HERO', 'HOME_BELOW_HERO',
        'CATEGORY_TOP', 'CATEGORY_BOTTOM', 'SEARCH_TOP', 'SEARCH_BOTTOM',
        'BLOG_LIST_TOP', 'BLOG_LIST_BOTTOM', 'ABOVE_TAGS', 'UNDER_DATE',
        'UNDER_HERO', 'UNDER_HERO_IMAGE', 'ABOVE_SHAREABLE', 'UNDER_SHAREABLE', 'INLINE',
        'UNDER_SHARE_1', 'UNDER_SHARE_2'
      )
    `);

    // Update the column to use the old enum type
    await queryRunner.query(`
      ALTER TABLE tenant_ad_setting 
      ALTER COLUMN placement TYPE tenant_ad_setting_placement_enum_old 
      USING placement::text::tenant_ad_setting_placement_enum_old
    `);

    // Drop the current enum type
    await queryRunner.query(`
      DROP TYPE tenant_ad_setting_placement_enum
    `);

    // Rename the old enum type back
    await queryRunner.query(`
      ALTER TYPE tenant_ad_setting_placement_enum_old 
      RENAME TO tenant_ad_setting_placement_enum
    `);
  }
}
