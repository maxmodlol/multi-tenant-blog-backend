// src/models/Tenant.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ unique: true, length: 50 })
  domain!: string; // e.g. "publisher1"

  @CreateDateColumn()
  createdAt!: Date;
}
