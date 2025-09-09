import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBlogRevision1712760000004 implements MigrationInterface {
  name = "CreateBlogRevision1712760000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_revision" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "blogId" uuid NOT NULL,
        "status" varchar(255) NOT NULL,
        "snapshot" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_revision_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_blog_revision_blog" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_revision"`);
  }
}




