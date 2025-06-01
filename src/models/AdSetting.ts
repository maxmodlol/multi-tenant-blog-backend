import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum Placement {
  ABOVE_TAGS = "ABOVE_TAGS",
  UNDER_DATE = "UNDER_DATE",
  UNDER_SHARE_1 = "UNDER_SHARE_1",
  UNDER_SHARE_2 = "UNDER_SHARE_2",
  INLINE = "INLINE",
}

export enum Appearance {
  LEFT_ALIGNED = "LEFT_ALIGNED",
  RIGHT_ALIGNED = "RIGHT_ALIGNED",
  POPUP = "POPUP",
}

@Entity()
@Index(["tenantId", "blogId"])
export class AdSetting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  blogId?: string;

  @Column({ type: "enum", enum: Placement })
  placement!: Placement;

  @Column({ type: "enum", enum: Appearance })
  appearance!: Appearance;

  @Column("text")
  codeSnippet!: string;

  @Column({ default: true })
  isEnabled!: boolean;

  @Column({ type: "int", nullable: true })
  positionOffset?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
