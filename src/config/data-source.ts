// src/config/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import { User } from "../models/User";
import { Blog } from "../models/Blog";
import { BlogPage } from "../models/BlogPage";
import { Category } from "../models/Category";
import { GlobalBlogIndex } from "../models/GlobalBlogIndex";
import { TenantUser } from "../models/TenantUser";
import { Tenant } from "../models/Tenant";
import { AdHeaderSetting } from "../models/AdHeaderSetting";
import { TenantAdSetting } from "../models/TenantAdSetting";
import { AdSetting } from "../models/AdSetting";
import { SiteSetting } from "../models/SiteSetting";
import { PasswordResetToken } from "../models/PasswordResetToken";
import { BlogRevision } from "../models/BlogRevision";

config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT! || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    User,
    Blog,
    BlogPage,
    Category,
    GlobalBlogIndex,
    TenantUser,
    Tenant,
    AdSetting,
    AdHeaderSetting,
    TenantAdSetting,
    SiteSetting,
    PasswordResetToken,
    BlogRevision,
  ],
  synchronize: false, // ← enabled to auto-create tablesgit ph or
  migrations: [__dirname + "/../migrations/*{.ts,.js}"], // ← add this
  logging: false,
});
