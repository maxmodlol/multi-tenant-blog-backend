import {
  Entity,
  Unique,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Role } from "../types/Role";

// src/models/TenantUser.ts  (public schema) ---------------------------------
@Entity()
@Unique(["tenant", "user"]) // one role per tenant per user
export class TenantUser {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ length: 50 }) tenant!: string; // "main" or sub‑domain
  @Column({ type: "enum", enum: Role }) role!: Role;

  @ManyToOne(() => User, (u) => u.links, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column() userId!: string; // FK, handy for JWT
}
