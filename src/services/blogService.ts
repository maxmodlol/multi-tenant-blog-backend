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
import { Tenant } from "../models/Tenant";

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
  console.log("input", input);
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
    description: input.description,
    categories,
  });

  await blogRepo.save(blog); // ⇒ blog.id is now available

  // pages ───────────────────────────────────────────────────────────────────
  blog.pages = input.pages.map(({ pageNumber, content }) =>
    blogPageRepo.create({ pageNumber, content })
  );
  await blogRepo.save(blog); // persist pages

  // global search index ─────────────────────────────────────────────────────
  // await indexBlogPost({
  //   blogId: blog.id,
  //   tenant: input.tenant,
  //   title: blog.title,
  //   coverPhoto: blog.coverPhoto,
  //   tags: blog.tags,
  // });

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
export const getBlogsForUser = async (
  tenant: string,
  authorId: string,
  page: number,
  limit: number,
  categorySlug?: string
): Promise<{
  blogs: (Blog & { author: { id: string; name: string } })[];
  totalPages: number;
  totalBlogs: number;
}> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);

  // Build query: filter by authorId (no status filter)
  const qb = blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.pages", "pages")
    .leftJoinAndSelect("blog.categories", "categories")
    .where("blog.authorId = :authorId", { authorId });

  if (categorySlug && categorySlug !== "all") {
    qb.andWhere("categories.name = :categorySlug", { categorySlug });
  }

  // pagination + count
  const [blogs, totalBlogs] = await qb
    .orderBy("blog.createdAt", "DESC")
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  // Enrich with author names (even though it's one author, reuse fetchAuthorsMap)
  const authorMap = await fetchAuthorsMap([authorId]);
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
async function findTenantForBlog(blogId: string): Promise<string> {
  // load your list of tenants however you store them
  const tenants = await AppDataSource.getRepository<Tenant>("Tenant").find();
  for (const t of tenants) {
    const repo = await getRepositoryForTenant(Blog, t.domain);
    if (await repo.findOne({ where: { id: blogId } })) {
      return t.domain;
    }
  }
  throw new ApiError(404, "Blog not found in any tenant");
}

// ——————————————————————————————————————————————————————
// Existing single‐tenant loader
// ——————————————————————————————————————————————————————

// ——————————————————————————————————————————————————————
// New admin‐only “any tenant” loader
// ——————————————————————————————————————————————————————
export async function getAnyTenantBlogById(
  id: string
): Promise<Blog & { author: { id: string; name: string } }> {
  // 1️⃣ discover which tenant holds this ID
  const tenant = await findTenantForBlog(id);
  // 2️⃣ delegate to the single‐tenant loader
  return getBlogById(tenant, id);
}
// … above imports …
async function getAllTenantSlugs(): Promise<string[]> {
  // e.g. a Tenant model you maintain in your DB
  const tenants = await AppDataSource.getRepository("Tenant").find();
  return tenants.map((t: any) => t.domain);
}

export const getDashboardBlogs = async (
  tenant: string, // could be "all" or a specific tenant slug
  page: number,
  limit: number,
  categorySlug?: string,
  statuses: BlogStatus[] = [],
  search?: string
): Promise<{
  blogs: (Blog & { author: { id: string; name: string }; tenant: string })[];
  totalPages: number;
  totalBlogs: number;
}> => {
  console.log("tenant dashboard", tenant);
  // ─── Admin view across all tenants ───────────────────────────────────────
  if (tenant === "all") {
    const slugs = await getAllTenantSlugs();
    console.log("slugs", slugs);
    let combined: (Blog & {
      author: { id: string; name: string };
      tenant: string;
    })[] = [];

    // For each tenant, fetch without restricting status
    for (const t of slugs) {
      console.log("t", t);
      const repo = await getRepositoryForTenant(Blog, t);
      let qb = repo
        .createQueryBuilder("blog")
        .leftJoinAndSelect("blog.pages", "pages")
        .leftJoinAndSelect("blog.categories", "categories");

      if (statuses.length) {
        qb = qb.andWhere("blog.status IN (:...statuses)", { statuses });
      }
      if (categorySlug && categorySlug !== "all") {
        qb = qb.andWhere("categories.name = :categorySlug", { categorySlug });
      }
      if (search) {
        qb = qb.andWhere("blog.title ILIKE :search", { search: `%${search}%` });
      }

      const blogs = await qb.getMany();
      const authorIds = [...new Set(blogs.map((b) => b.authorId))];
      const authorMap = await fetchAuthorsMap(authorIds);

      combined.push(
        ...blogs.map((b) => ({
          ...b,
          author: {
            id: b.authorId,
            name: authorMap[b.authorId] ?? "مؤلف مجهول",
          },
          tenant: t,
        }))
      );
    }

    // sort & paginate in-memory
    combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const totalBlogs = combined.length;
    const totalPages = Math.ceil(totalBlogs / limit);
    const sliceStart = (page - 1) * limit;
    const paged = combined.slice(sliceStart, sliceStart + limit);

    return { blogs: paged, totalBlogs, totalPages };
  }

  // ─── Publisher/editor: single-tenant view ───────────────────────────────
  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  let qb = blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.pages", "pages")
    .leftJoinAndSelect("blog.categories", "categories");

  if (statuses.length) {
    qb = qb.where("blog.status IN (:...statuses)", { statuses });
  }
  if (categorySlug && categorySlug !== "all") {
    qb = qb.andWhere("categories.name = :categorySlug", { categorySlug });
  }
  if (search) {
    qb = qb.andWhere("blog.title ILIKE :search", { search: `%${search}%` });
  }

  const [blogsRaw, totalBlogs] = await qb
    .orderBy("blog.createdAt", "DESC")
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  const authorIds = [...new Set(blogsRaw.map((b) => b.authorId))];
  const authorMap = await fetchAuthorsMap(authorIds);

  const enriched = blogsRaw.map((b) => ({
    ...b,
    author: { id: b.authorId, name: authorMap[b.authorId] ?? "مؤلف مجهول" },
    tenant,
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

    const newPages = pages.map(({ pageNumber, content }) =>
      blogPageRepo.create({ pageNumber, content })
    );
    blog.pages = newPages;
  }

  await blogRepo.save(blog);
  return blog;
};

// Delete a blog
export const deleteBlog = async (tenant: string, id: string): Promise<void> => {
  console.log("tenant", tenant);
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

  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const domain = process.env.NAVIGATION_DOMAIN ?? "localhost:3000";
  const authors = await fetchAuthorsMap(results.map((r) => r.authorId));

  return results.map((r) => ({
    ...r,
    author: { id: r.authorId, name: authors[r.authorId] ?? "مؤلف مجهول" },
    url:
      r.tenant === "main"
        ? `${proto}://${domain}/blogs/${r.blogId}`
        : `${proto}://${r.tenant}.${domain}/blogs/${r.blogId}`,
  }));
};

// Update blog status (for publisher side: only allow DRAFTED or READY_TO_PUBLISH)
export const updateBlogStatus = async (
  tenant: string,
  id: string,
  status: string
): Promise<Blog> => {
  if (
    status !== BlogStatus.DRAFTED &&
    status !== BlogStatus.READY_TO_PUBLISH &&
    status !== BlogStatus.ACCEPTED &&
    status !== BlogStatus.DECLINED
  ) {
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
