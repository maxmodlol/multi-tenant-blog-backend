import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewAdPlacements1735000000001 implements MigrationInterface {
  name = "AddNewAdPlacements1735000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new placement values to the enum
    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'UNDER_TAGS'
    `);
    
    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'UNDER_HERO'
    `);
    
    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'ABOVE_SHAREABLE'
    `);
    
    await queryRunner.query(`
      ALTER TYPE "tenant_ad_setting_placement_enum" 
      ADD VALUE IF NOT EXISTS 'UNDER_SHAREABLE'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This migration cannot be easily reversed without recreating the enum
    // In production, you would need to:
    // 1. Create a new enum with only the desired values
    // 2. Update the column to use the new enum
    // 3. Drop the old enum
    
    console.warn("Cannot remove enum values in PostgreSQL. Manual intervention required.");
  }
}
