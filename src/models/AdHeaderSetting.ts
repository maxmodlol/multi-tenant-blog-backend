import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class AdHeaderSetting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // The <script> block to load Google Ads globally
  @Column("text")
  headerSnippet!: string;

  @Column({ default: true })
  isEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
