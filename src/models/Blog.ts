import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { BlogPage } from "./BlogPage";
import { Category } from "./Category";
import { BlogStatus } from "../types/blogsType";

@Entity()
export class Blog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ nullable: true })
  description?: string;
  // URL for the cover photo image
  @Column({ nullable: true })
  coverPhoto?: string;

  // Tags stored as a simple array
  @Column("simple-array", { nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Store the author's global user ID (instead of a relation to the User entity)
  @Column({ name: "authorId", type: "uuid" })
  authorId!: string;

  // Blog status: drafted, accepted, or declined
  @Column({
    type: "enum",
    enum: BlogStatus,
    default: BlogStatus.DRAFTED,
  })
  status!: BlogStatus;

  // One blog post can have multiple pages
  @OneToMany(() => BlogPage, (page) => page.blog, {
    cascade: true,
    eager: true,
  })
  pages!: BlogPage[];

  // Many-to-many relationship with Category
  @ManyToMany(() => Category, (category) => category.blogs, {
    cascade: true,
    eager: true,
  })
  @JoinTable() // Automatically creates the join table
  categories!: Category[];
}
