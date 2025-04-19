import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Blog } from "./Blog";

@Entity()
export class BlogPage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Order number of the page (e.g., 1, 2, 3)
  @Column()
  pageNumber!: number;

  // Content of the page from a rich text editor (HTML or JSON)
  @Column("text")
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Blog, (blog) => blog.pages, { onDelete: "CASCADE" })
  blog!: Blog;
}
