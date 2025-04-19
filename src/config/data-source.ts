import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../models/User";
import { config } from "dotenv";
import { GlobalBlogIndex } from "../models/GlobalBlogIndex";
import { Blog } from "../models/Blog";
import { BlogPage } from "../models/BlogPage";
import { Category } from "../models/Category";

config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Blog, BlogPage, Category, GlobalBlogIndex],
  synchronize: true, // For development only; use migrations in production
  logging: false,
});
