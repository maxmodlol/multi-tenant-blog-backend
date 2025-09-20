// src/models/TenantAdSetting.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum TenantAdPlacement {
  HEADER = "HEADER",
  FOOTER = "FOOTER",
  SIDEBAR = "SIDEBAR",
  HOME_HERO = "HOME_HERO",
  HOME_BELOW_HERO = "HOME_BELOW_HERO",
  CATEGORY_TOP = "CATEGORY_TOP",
  CATEGORY_BOTTOM = "CATEGORY_BOTTOM",
  SEARCH_TOP = "SEARCH_TOP",
  SEARCH_BOTTOM = "SEARCH_BOTTOM",
  BLOG_LIST_TOP = "BLOG_LIST_TOP",
  BLOG_LIST_BOTTOM = "BLOG_LIST_BOTTOM",
}

export enum TenantAdAppearance {
  FULL_WIDTH = "FULL_WIDTH",
  LEFT_ALIGNED = "LEFT_ALIGNED",
  RIGHT_ALIGNED = "RIGHT_ALIGNED",
  CENTERED = "CENTERED",
  POPUP = "POPUP",
  STICKY = "STICKY",
}

@Entity()
@Index(["tenantId", "placement"])
@Index(["tenantId", "isEnabled"])
export class TenantAdSetting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  tenantId!: string;

  @Column({ type: "enum", enum: TenantAdPlacement })
  placement!: TenantAdPlacement;

  @Column({ type: "enum", enum: TenantAdAppearance })
  appearance!: TenantAdAppearance;

  @Column("text")
  codeSnippet!: string;

  @Column({ default: true })
  isEnabled!: boolean;

  @Column({ type: "int", default: 0 })
  priority!: number; // Higher priority ads appear first

  @Column({ type: "text", nullable: true })
  title?: string; // Human-readable name for the ad

  @Column({ type: "text", nullable: true })
  description?: string; // Description of where this ad appears

  @Column({ type: "varchar", length: 255, nullable: true })
  scope?: string; // "main" = main domain only, "all" = all domains, or specific tenant ID

  @Column({ type: "varchar", length: 255, nullable: true })
  blogId?: string; // Only used for blog-specific placements

  @Column({ type: "int", nullable: true })
  positionOffset?: number; // For INLINE placement: how many words before injecting

  @Column({ type: "json", nullable: true })
  targetingRules?: {
    pageTypes?: string[]; // ["home", "category", "search", "blog"]
    excludePageTypes?: string[];
    userRoles?: string[]; // ["guest", "user", "admin"]
    deviceTypes?: string[]; // ["desktop", "mobile", "tablet"]
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
