import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBio1712760000000 implements MigrationInterface {
  name = "AddUserBio1712760000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "bio" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
  }
}
