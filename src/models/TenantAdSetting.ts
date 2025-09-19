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
  // Site-wide placements (home, category, search pages)
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

  // Blog-specific placements (individual blog posts)
  ABOVE_TAGS = "ABOVE_TAGS",
  UNDER_DATE = "UNDER_DATE",
  UNDER_HERO = "UNDER_HERO",
  UNDER_HERO_IMAGE = "UNDER_HERO_IMAGE",
  ABOVE_SHAREABLE = "ABOVE_SHAREABLE",
  UNDER_SHAREABLE = "UNDER_SHAREABLE",
  INLINE = "INLINE",
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
@Index(["scope", "placement"])
@Index(["blogId"])
export class TenantAdSetting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  tenantId!: string; // "main" for main domain, "all" for global, or specific tenant ID

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

  // New scope field: "main", "all", or specific tenant ID
  @Column({ type: "varchar", length: 255, default: "main" })
  scope!: string; // "main" = main domain only, "all" = all domains, or specific tenant ID

  // For blog-specific ads
  @Column({ type: "uuid", nullable: true })
  blogId?: string; // Only used for blog-specific placements

  // For INLINE placement: how many words before injecting
  @Column({ type: "int", nullable: true })
  positionOffset?: number;

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
