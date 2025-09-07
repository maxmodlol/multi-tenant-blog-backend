export enum BlogStatus {
  DRAFTED = "DRAFTED",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  READY_TO_PUBLISH = "READY_TO_PUBLISH",
  PENDING_REAPPROVAL = "PENDING_REAPPROVAL",
}
export interface BlogPageInput {
  pageNumber: number;
  content: string;
}

export interface CreateBlogInput {
  title: string;
  coverPhoto?: string;
  tags?: string[];
  categoryNames?: string[];
  pages: BlogPageInput[];
  description?: string;
  authorId: string;
  tenant: string;
}

export interface IndexBlogData {
  blogId: string;
  tenant: string;
  authorId: string;
  title: string;
  coverPhoto?: string;
  tags?: string[];
}
export interface MulterS3File extends Express.Multer.File {
  location: string;
}
