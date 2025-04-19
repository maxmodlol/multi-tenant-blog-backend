// src/models/Category.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Blog } from "../models/Blog";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @ManyToMany(() => Blog, blog => blog.categories)
  blogs!: Blog[];
}
