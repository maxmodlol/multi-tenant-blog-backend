import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Blog } from "./Blog";
import { BlogStatus } from "../types/blogsType";

@Entity()
export class BlogRevision {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  blogId!: string;

  @ManyToOne(() => Blog)
  @JoinColumn({ name: "blogId" })
  blog!: Blog;

  @Column({ type: "enum", enum: BlogStatus })
  status!: BlogStatus; // status of the blog at the time of snapshot

  @Column({ type: "jsonb" })
  snapshot!: any; // full snapshot (title, description, tags, coverPhoto, pages, categories, updatedAt)

  @CreateDateColumn()
  createdAt!: Date;
}
