import { AppDataSource } from "../config/data-source";
import { GlobalBlogIndex } from "../models/GlobalBlogIndex";
import { IndexBlogData } from "../types/blogsType";



export const indexBlogPost = async (data: IndexBlogData): Promise<void> => {
  const repo = AppDataSource.getRepository(GlobalBlogIndex);
  let entry = await repo.findOne({ where: { blogId: data.blogId, tenant: data.tenant } });
  if (!entry) {
    entry = repo.create(data);
  } else {
    Object.assign(entry, data);
  }
  await repo.save(entry);
};

export const removeBlogIndex = async (blogId: string, tenant: string): Promise<void> => {
  const repo = AppDataSource.getRepository(GlobalBlogIndex);
  await repo.delete({ blogId, tenant });
};
