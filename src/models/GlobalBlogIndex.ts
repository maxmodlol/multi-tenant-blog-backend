import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ schema: "public" }) // or your chosen shared schema
export class GlobalBlogIndex {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // The ID of the blog in the tenant's schema
  @Column()
  blogId!: string;

  @Column({ type: "uuid" })
  authorId!: string;
  // The tenant identifier (subdomain or "main" for global blogs)
  @Column({ length: 50 })
  tenant!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ nullable: true })
  coverPhoto?: string;

  // Optionally store tags as a comma-separated list
  @Column("simple-array", { nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
