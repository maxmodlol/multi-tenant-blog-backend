// src/models/SiteSetting.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class SiteSetting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Two logo URLs (nullable)
  @Column({ type: "text", nullable: true })
  logoLightUrl?: string;

  @Column({ type: "text", nullable: true })
  logoDarkUrl?: string;

  /**
   * Store a single “base color” as an HSL string: "H S% L%"
   * e.g. "216 56% 45%". We’ll generate 100–900 variations server-side.
   */
  @Column({ type: "varchar", length: 32, default: "240 20% 50%" })
  baseColor!: string;
  @Column({ type: "varchar", length: 16, default: "gradient" })
  headerStyle!: "gradient" | "solid";
  /**
   * Optional per-tenant override when `headerStyle === "solid"`.
   * Stored in the same “H S% L%” format we already use.
   * If null we fall back to the tenant’s baseColor.
   */
  @Column({ type: "varchar", length: 32, nullable: true })
  headerColor?: string | null;
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
