import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetToken1712760000001 implements MigrationInterface {
  name = "AddPasswordResetToken1712760000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_token" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "token" varchar(255) NOT NULL,
        "userId" uuid NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_token_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_token_token" UNIQUE ("token"),
        CONSTRAINT "FK_password_reset_token_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_token"`);
  }
}
