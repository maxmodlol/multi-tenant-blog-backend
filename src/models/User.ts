// src/models/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from "typeorm";
import * as bcrypt from "bcrypt";
import { TenantUser } from "./TenantUser";

// src/models/User.ts  (public schema) ---------------------------------------
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ length: 50 }) name!: string;
  @Column({ unique: true }) email!: string;
  @Column() password!: string;
  @Column({ nullable: true }) avatarUrl?: string; // ← new!

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hash() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // convenience: what links does this user have?
  @OneToMany(() => TenantUser, (tu) => tu.user) links!: TenantUser[];
}
