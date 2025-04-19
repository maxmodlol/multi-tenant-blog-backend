// src/services/blogService.ts
import { Blog } from "../models/Blog";
import { BlogPage } from "../models/BlogPage";
import { Category } from "../models/Category";
import { indexBlogPost } from "../services/globalBlogIndexService";
import { ApiError } from "../utils/ApiError";
import { CreateBlogInput } from "../types/blogsType";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { GlobalBlogIndex } from "../models/GlobalBlogIndex";
import { AppDataSource } from "../config/data-source";
import { BlogStatus } from "../types/blogsType";
import { Not } from "typeorm";
import { fetchAuthor, fetchAuthorsMap } from "../utils/fetchAuthors";

///////////////////////////////////////////////////////////////////////////////
// 1.  CREATE  ────────────────────────────────────────────────────────────────
///////////////////////////////////////////////////////////////////////////////
export const createBlog = async (input: CreateBlogInput): Promise<Blog> => {
  // validation ──────────────────────────────────────────────────────────────
  if (!input.title) throw new ApiError(400, "Title is required");
  if (!input.pages?.length)
    throw new ApiError(400, "At least one page is required");
  if (!input.authorId) throw new ApiError(400, "Author ID is required");
  if (!input.tenant) throw new ApiError(400, "Tenant identifier is required");

  // tenant‑scoped repositories
  const blogRepo = await getRepositoryForTenant(Blog, input.tenant);
  const categoryRepo = await getRepositoryForTenant(Category, input.tenant);
  const blogPageRepo = await getRepositoryForTenant(BlogPage, input.tenant);

  // categories ──────────────────────────────────────────────────────────────
  const categories: Category[] = [];
  if (input.categoryNames?.length) {
    for (const name of input.categoryNames) {
      let cat = await categoryRepo.findOne({ where: { name } });
      if (!cat) {
        // create on‑the‑fly
        cat = categoryRepo.create({ name });
        await categoryRepo.save(cat);
      }
      categories.push(cat);
    }
  }

  // blog core object (NOTICE authorId, not author:{} ) ──────────────────────
  const blog = blogRepo.create({
    title: input.title,
    coverPhoto: input.coverPhoto,
    tags: input.tags,
    authorId: input.authorId,
    categories,
  });

  await blogRepo.save(blog); // ⇒ blog.id is now available

  // pages ───────────────────────────────────────────────────────────────────
  blog.pages = input.pages.map((content, i) =>
    blogPageRepo.create({ pageNumber: i + 1, content, blog })
  );
  await blogRepo.save(blog); // persist pages

  // global search index ─────────────────────────────────────────────────────
  await indexBlogPost({
    blogId: blog.id,
    tenant: input.tenant,
    title: blog.title,
    coverPhoto: blog.coverPhoto,
    tags: blog.tags,
  });

  return blog;
};

///////////////////////////////////////////////////////////////////////////////
// 2.  GET‑ALL  (with author enrichment)  ────────────────────────────────────
///////////////////////////////////////////////////////////////////////////////
export const getAllBlogs = async (
  tenant: string,
  page: number,
  limit: number,
  categorySlug?: string
): Promise<{
  blogs: (Blog & { author: { id: string; name: string } })[];
  totalPages: number;
  totalBlogs: number;
}> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);

  const qb = blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.pages", "pages")
    .leftJoinAndSelect("blog.categories", "categories")
    .where("blog.status = :status", { status: BlogStatus.ACCEPTED });

  if (categorySlug && categorySlug !== "all") {
    qb.andWhere("categories.name = :categorySlug", { categorySlug });
  }

  const [blogs, totalBlogs] = await qb
    .orderBy("blog.createdAt", "DESC")
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  // ── Enrich with author profiles (public/User table) ──────────────────────
  const authorIds = [...new Set(blogs.map((b) => b.authorId))];
  const authorMap = await fetchAuthorsMap(authorIds);
  console.log("authermpa0", authorMap);
  const enriched = blogs.map((b) => ({
    ...b,
    author: {
      id: b.authorId,
      name: authorMap[b.authorId] ?? "مؤلف مجهول",
    },
  }));

  return {
    blogs: enriched,
    totalBlogs,
    totalPages: Math.ceil(totalBlogs / limit),
  };
};

// Retrieve a specific approved blog by ID
export const getBlogById = async (
  tenant: string,
  id: string
): Promise<Blog & { author: { id: string; name: string } }> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  const blog = await blogRepo.findOne({
    where: { id },
    relations: ["pages", "categories"], // 🍃 No author here
  });
  if (!blog) throw new ApiError(404, "Blog not found");

  const author = await fetchAuthor(blog.authorId);
  return { ...blog, author };
};

// Update a blog (pages are handled separately)
export const updateBlog = async (
  tenant: string,
  id: string,
  updateData: Partial<CreateBlogInput>
): Promise<Blog> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  let blog = await blogRepo.findOne({
    where: { id },
    relations: ["pages", "categories"],
  });
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  // Destructure pages out of updateData so we don't merge a string[] into BlogPage[]
  const { pages, ...rest } = updateData;
  blog = blogRepo.merge(blog, rest);

  // If pages are provided, remove existing pages and then create new ones.
  if (pages) {
    const blogPageRepo = await getRepositoryForTenant(BlogPage, tenant);

    if (blog.pages && blog.pages.length > 0) {
      await blogPageRepo.remove(blog.pages);
    }

    const newPages = pages.map((pageContent, index) =>
      blogPageRepo.create({
        pageNumber: index + 1,
        content: pageContent,
        blog: blog,
      })
    );
    blog.pages = newPages;
  }

  await blogRepo.save(blog);
  return blog;
};

// Delete a blog
export const deleteBlog = async (tenant: string, id: string): Promise<void> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  const result = await blogRepo.delete(id);
  if (result.affected === 0) {
    throw new ApiError(404, "Blog not found");
  }
};

// Global search: only return approved blogs from the global index
export const searchBlogs = async (
  query: string
): Promise<(GlobalBlogIndex & { url: string })[]> => {
  const globalRepo = AppDataSource.getRepository(GlobalBlogIndex);

  const results = await globalRepo
    .createQueryBuilder("index")
    .where("index.title ILIKE :query OR index.tags ILIKE :query", {
      query: `%${query}%`,
    })
    .orderBy("index.createdAt", "DESC")
    .getMany();

  const domain = process.env.MAIN_DOMAIN || "yourdomain.com";

  const authors = await fetchAuthorsMap(results.map((r) => r.authorId));

  return results.map((r) => ({
    ...r,
    author: { id: r.authorId, name: authors[r.authorId] ?? "مؤلف مجهول" },
    url:
      r.tenant === "main"
        ? `https://${domain}/blogs/${r.blogId}`
        : `https://${r.tenant}.${domain}/blogs/${r.blogId}`,
  }));
};

// Update blog status (for publisher side: only allow DRAFTED or READY_TO_PUBLISH)
export const updateBlogStatus = async (
  tenant: string,
  id: string,
  status: string
): Promise<Blog> => {
  if (status !== BlogStatus.DRAFTED && status !== BlogStatus.READY_TO_PUBLISH) {
    throw new ApiError(400, "Invalid status for publisher update");
  }

  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  let blog = await blogRepo.findOne({ where: { id } });
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  blog.status = status as BlogStatus;
  await blogRepo.save(blog);
  return blog;
};
///////////////////////////////////////////////////////////////////////////////
//  getRelatedBlogs  – now returns author info too
///////////////////////////////////////////////////////////////////////////////
export const getRelatedBlogs = async (
  tenant: string,
  currentBlogId: string,
  limit = 4
): Promise<(Blog & { author: { id: string; name: string } | undefined })[]> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);

  // 1) current blog (for tags / categories)
  const current = await blogRepo.findOne({
    where: { id: currentBlogId },
    relations: ["categories"],
  });
  if (!current) throw new ApiError(404, "Blog not found");

  // 2) candidate query (same as before)  ………………………………………
  const categoryIds = current.categories.map((c) => c.id);
  const tags = current.tags ?? [];

  const qb = blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.categories", "cat")
    .where("blog.status = :status", { status: BlogStatus.ACCEPTED })
    .andWhere("blog.id != :id", { id: currentBlogId })
    .orderBy("blog.createdAt", "DESC")
    .take(limit);

  if (categoryIds.length)
    qb.andWhere("cat.id IN (:...categoryIds)", { categoryIds });
  if (tags.length)
    qb.andWhere(
      tags.map((_, i) => `blog.tags LIKE :t${i}`).join(" OR "),
      tags.reduce((a, t, i) => ({ ...a, [`t${i}`]: `%${t}%` }), {})
    );

  const blogs = await qb.getMany();

  // 3) ─── grab all authorIds, fetch names in **one** query ─────────────────
  const authorIds = [...new Set(blogs.map((b) => b.authorId))];
  const authorMap = await fetchAuthorsMap(authorIds);

  // 4) ─── attach author object and return ──────────────────────────────────
  return blogs.map((b) => ({
    ...b,
    author: b.authorId
      ? { id: b.authorId, name: authorMap[b.authorId] ?? "مؤلف مجهول" }
      : undefined,
  }));
};
