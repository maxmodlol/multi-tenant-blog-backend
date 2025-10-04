// src/services/blogService.ts
import { Blog } from "../models/Blog";
import { BlogPage } from "../models/BlogPage";
import { Category } from "../models/Category";
import {
  indexBlogPost,
  removeBlogIndex,
} from "../services/globalBlogIndexService";
import { ApiError } from "../utils/ApiError";
import { CreateBlogInput } from "../types/blogsType";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { GlobalBlogIndex } from "../models/GlobalBlogIndex";
import { AppDataSource } from "../config/data-source";
import { BlogStatus } from "../types/blogsType";
// import { Not } from "typeorm";
import { fetchAuthor, fetchAuthorsMap } from "../utils/fetchAuthors";
import { Tenant } from "../models/Tenant";
import { BlogRevision } from "../models/BlogRevision";

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
    description: input.description,
    categories,
  });

  await blogRepo.save(blog); // ⇒ blog.id is now available

  // pages ───────────────────────────────────────────────────────────────────
  blog.pages = input.pages.map(({ pageNumber, content }) =>
    blogPageRepo.create({ pageNumber, content })
  );
  await blogRepo.save(blog); // persist pages

  // Note: indexing happens on acceptance below

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
  try {
    const blogRepo = await getRepositoryForTenant(Blog, tenant);

    const qb = blogRepo
      .createQueryBuilder("blog")
      .leftJoinAndSelect("blog.pages", "pages")
      .leftJoinAndSelect("blog.categories", "categories")
      .where("blog.status = :status", { status: BlogStatus.ACCEPTED })
      .orderBy("pages.pageNumber", "ASC");

    if (categorySlug && categorySlug !== "all") {
      // Debug: Check what categories exist in the database
      const categoryRepo = await getRepositoryForTenant(Category, tenant);

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
  } catch (error) {
    console.error("Backend getAllBlogs - Error details:", error);
    console.error(
      "Backend getAllBlogs - Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    throw error;
  }
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
    .where("blog.authorId = :authorId", { authorId })
    .orderBy("pages.pageNumber", "ASC");

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

export const getDashboardBlogs = async (
  tenant: string, // "all" or a specific tenant slug
  page: number,
  limit: number,
  categorySlug?: string,
  statusFilter?: BlogStatus, // now a single status or undefined
  search?: string
): Promise<{
  blogs: (Blog & { author: { id: string; name: string }; tenant: string })[];
  totalPages: number;
  totalBlogs: number;
}> => {
  // Admin: aggregate across all tenants
  if (tenant === "all") {
    // 1) fetch all tenant slugs from your Tenant table
    const tenants = await AppDataSource.getRepository<Tenant>("Tenant").find();
    const slugs = tenants.map((t) => t.domain);
    const combined: (Blog & {
      author: { id: string; name: string };
      tenant: string;
    })[] = [];

    for (const t of slugs) {
      const repo = await getRepositoryForTenant(Blog, t);
      let qb = repo
        .createQueryBuilder("blog")
        .leftJoinAndSelect("blog.pages", "pages")
        .leftJoinAndSelect("blog.categories", "categories");

      // Build WHERE conditions
      const whereConditions: string[] = [];
      const parameters: any = {};

      // apply single‐status filter
      if (statusFilter) {
        whereConditions.push("blog.status = :statusFilter");
        parameters.statusFilter = statusFilter;
      }

      if (categorySlug && categorySlug !== "all") {
        whereConditions.push("categories.name = :categorySlug");
        parameters.categorySlug = categorySlug;
      }

      if (search) {
        whereConditions.push("blog.title ILIKE :search");
        parameters.search = `%${search}%`;
      }

      // Apply WHERE conditions if any exist
      if (whereConditions.length > 0) {
        qb = qb.where(whereConditions.join(" AND "), parameters);
      }

      const blogsForThisTenant = await qb.getMany();
      const authorIds = [...new Set(blogsForThisTenant.map((b) => b.authorId))];
      const authorMap = await fetchAuthorsMap(authorIds);

      combined.push(
        ...blogsForThisTenant.map((b) => ({
          ...b,
          author: {
            id: b.authorId,
            name: authorMap[b.authorId] ?? "مؤلف مجهول",
          },
          tenant: t,
        }))
      );
    }

    // sort + pagination in‐memory
    combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const totalBlogs = combined.length;
    const totalPages = Math.ceil(totalBlogs / limit);
    const start = (page - 1) * limit;
    const paged = combined.slice(start, start + limit);

    return { blogs: paged, totalBlogs, totalPages };
  }

  // Publisher/editor: single‐tenant view
  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  let qb = blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.pages", "pages")
    .leftJoinAndSelect("blog.categories", "categories")
    .orderBy("pages.pageNumber", "ASC");

  // Build WHERE conditions
  const whereConditions: string[] = [];
  const parameters: any = {};

  // single‐status filter
  if (statusFilter) {
    whereConditions.push("blog.status = :statusFilter");
    parameters.statusFilter = statusFilter;
  }

  if (categorySlug && categorySlug !== "all") {
    whereConditions.push("categories.name = :categorySlug");
    parameters.categorySlug = categorySlug;
  }

  if (search) {
    whereConditions.push("blog.title ILIKE :search");
    parameters.search = `%${search}%`;
  }

  // Apply WHERE conditions if any exist
  if (whereConditions.length > 0) {
    qb = qb.where(whereConditions.join(" AND "), parameters);
  }

  const [rawBlogs, totalCount] = await qb
    .orderBy("blog.createdAt", "DESC")
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  const authorIds = [...new Set(rawBlogs.map((b) => b.authorId))];
  const authorMap = await fetchAuthorsMap(authorIds);

  const enriched = rawBlogs.map((b) => ({
    ...b,
    author: { id: b.authorId, name: authorMap[b.authorId] ?? "مؤلف مجهول" },
    tenant,
  }));

  return {
    blogs: enriched,
    totalBlogs: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
};

// Retrieve a specific approved blog by ID
export const getBlogById = async (
  tenant: string,
  id: string
): Promise<Blog & { author: { id: string; name: string } }> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  const blog = await blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.pages", "pages")
    .leftJoinAndSelect("blog.categories", "categories")
    .where("blog.id = :id", { id })
    .orderBy("pages.pageNumber", "ASC")
    .getOne();

  if (!blog) throw new ApiError(404, "Blog not found");

  const author = await fetchAuthor(blog.authorId);
  return { ...blog, author };
};

/**
 * Public-safe variant: only returns a blog if it's ACCEPTED.
 */
export const getApprovedPublicBlogById = async (
  tenant: string,
  id: string
): Promise<Blog & { author: { id: string; name: string } }> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  const blog = await blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.pages", "pages")
    .leftJoinAndSelect("blog.categories", "categories")
    .where("blog.id = :id AND blog.status = :status", {
      id,
      status: BlogStatus.ACCEPTED,
    })
    .orderBy("pages.pageNumber", "ASC")
    .getOne();

  if (blog) {
    // Blog is currently accepted, return it directly
    const author = await fetchAuthor(blog.authorId);
    return { ...blog, author };
  }

  // Blog not found with ACCEPTED status, check if it's in PENDING_REAPPROVAL
  const pendingBlog = await blogRepo.findOne({
    where: { id, status: BlogStatus.PENDING_REAPPROVAL },
  });

  if (!pendingBlog) {
    throw new ApiError(404, "Blog not found or not approved");
  }

  // Blog is in PENDING_REAPPROVAL, get the latest revision (snapshot of the last approved version)
  const revRepo = await getRepositoryForTenant(BlogRevision, tenant);
  const revision = await revRepo.findOne({
    where: { blogId: id },
    order: { createdAt: "DESC" }, // Get the most recent revision
  });

  if (!revision) {
    throw new ApiError(404, "Blog revision not found");
  }

  // Reconstruct the blog from the revision snapshot
  const snapshot = revision.snapshot;
  const reconstructedBlog = {
    id: pendingBlog.id,
    title: snapshot.title,
    description: snapshot.description,
    coverPhoto: snapshot.coverPhoto,
    tags: snapshot.tags,
    authorId: pendingBlog.authorId,
    status: BlogStatus.ACCEPTED, // Return as ACCEPTED since this is the approved version
    createdAt: pendingBlog.createdAt,
    updatedAt: snapshot.updatedAt,
    pages:
      snapshot.pages?.map((pageData: any) => ({
        id: `temp-${pageData.pageNumber}`, // Temporary ID for pages from snapshot
        pageNumber: pageData.pageNumber,
        content: pageData.content,
        blogId: pendingBlog.id,
      })) || [],
    categories: snapshot.categories || [],
  };

  const author = await fetchAuthor(pendingBlog.authorId);
  return { ...reconstructedBlog, author };
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

  // ✅ If the blog is accepted and being edited, snapshot and mark for re-approval
  if (blog.status === BlogStatus.ACCEPTED) {
    const revRepo = await getRepositoryForTenant(BlogRevision, tenant);
    const snapshot = {
      title: blog.title,
      description: blog.description,
      coverPhoto: blog.coverPhoto,
      tags: blog.tags,
      pages:
        blog.pages?.map((p) => ({
          pageNumber: p.pageNumber,
          content: p.content,
        })) ?? [],
      categories:
        blog.categories?.map((c) => ({ id: c.id, name: c.name })) ?? [],
      updatedAt: blog.updatedAt,
    };
    const rev = revRepo.create({
      blogId: blog.id,
      status: blog.status,
      snapshot,
    });
    await revRepo.save(rev);
    blog.status = BlogStatus.PENDING_REAPPROVAL;

    // ✅ Keep the old version in global index until re-approved
    // The published version remains searchable while changes are pending
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

  // Handle categories by names if provided in updateData
  if ((updateData as any).categoryNames) {
    const categoryNames: string[] = Array.isArray(
      (updateData as any).categoryNames
    )
      ? ((updateData as any).categoryNames as string[])
      : [];
    const categoryRepo = await getRepositoryForTenant(Category, tenant);
    const categories: Category[] = [];
    for (const name of categoryNames) {
      let cat = await categoryRepo.findOne({ where: { name } });
      if (!cat) {
        cat = categoryRepo.create({ name });
        await categoryRepo.save(cat);
      }
      categories.push(cat);
    }
    blog.categories = categories;
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
  query: string,
  tenant?: string
): Promise<(GlobalBlogIndex & { url: string })[]> => {
  const globalRepo = AppDataSource.getRepository(GlobalBlogIndex);

  // Build query builder dynamically
  let qb = globalRepo.createQueryBuilder("index");

  if (query) {
    qb = qb.where("(index.title ILIKE :query OR index.tags ILIKE :query)", {
      query: `%${query}%`,
    });
  }

  if (tenant) {
    if (query) {
      qb = qb.andWhere("index.tenant = :tenant", { tenant });
    } else {
      qb = qb.where("index.tenant = :tenant", { tenant });
    }
  }

  qb = qb.orderBy("index.createdAt", "DESC");

  const results = await qb.getMany();

  // Build URL per tenant/blogId
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const rawDomain =
    process.env.NAVIGATION_DOMAIN ||
    process.env.MAIN_DOMAIN ||
    "localhost:3000";
  // sanitize domain: strip protocol and any path/query
  const domain = rawDomain
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .trim();
  const authorIds = results.map((r) => r.authorId);
  const authors = await fetchAuthorsMap(authorIds);

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
  const validStatuses = [
    BlogStatus.DRAFTED,
    BlogStatus.READY_TO_PUBLISH,
    BlogStatus.ACCEPTED,
    BlogStatus.DECLINED,
    BlogStatus.PENDING_REAPPROVAL, // ✅ allow new status
  ];

  if (!validStatuses.includes(status as BlogStatus)) {
    throw new ApiError(400, "Invalid status for publisher update");
  }

  const blogRepo = await getRepositoryForTenant(Blog, tenant);
  const blog = await blogRepo.findOne({ where: { id } });

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  const wasAcceptedBefore = blog.status === BlogStatus.ACCEPTED;
  blog.status = status as BlogStatus;
  await blogRepo.save(blog);

  // Handle global index based on status changes
  if (blog.status === BlogStatus.ACCEPTED) {
    // ✅ Add/Update global index when transitioning to ACCEPTED
    // This handles both new approvals and re-approvals after PENDING_REAPPROVAL
    await indexBlogPost({
      blogId: blog.id,
      tenant,
      authorId: blog.authorId,
      title: blog.title,
      coverPhoto: blog.coverPhoto,
      tags: blog.tags,
    });
  } else if (
    wasAcceptedBefore &&
    blog.status !== BlogStatus.PENDING_REAPPROVAL
  ) {
    // ✅ Remove from global index when transitioning away from ACCEPTED
    // But keep it for PENDING_REAPPROVAL (old version stays published)
    try {
      await removeBlogIndex(blog.id, tenant);
    } catch (error) {
      console.warn(
        `Failed to remove blog ${blog.id} from global index:`,
        error
      );
    }
  }

  return blog;
};
///////////////////////////////////////////////////////////////////////////////
//  getRelatedBlogs  - now returns author info too
///////////////////////////////////////////////////////////////////////////////
export const getRelatedBlogs = async (
  tenant: string,
  currentBlogId: string,
  limit = 4
): Promise<(Blog & { author: { id: string; name: string } | undefined })[]> => {
  const blogRepo = await getRepositoryForTenant(Blog, tenant);

  // 1) Fetch current blog (for tags / categories)
  const current = await blogRepo.findOne({
    where: { id: currentBlogId },
    relations: ["categories"],
  });
  if (!current) throw new ApiError(404, "Blog not found");

  const categoryIds = current.categories.map((c) => c.id);
  const tags = current.tags ?? [];

  // 2) Try to get blogs with matching categories or tags
  const qb = blogRepo
    .createQueryBuilder("blog")
    .leftJoinAndSelect("blog.categories", "cat")
    .where("blog.status = :status", { status: BlogStatus.ACCEPTED })
    .andWhere("blog.id != :id", { id: currentBlogId });

  if (categoryIds.length)
    qb.andWhere("cat.id IN (:...categoryIds)", { categoryIds });
  if (tags.length)
    qb.andWhere(
      tags.map((_, i) => `blog.tags LIKE :t${i}`).join(" OR "),
      tags.reduce((a, t, i) => ({ ...a, [`t${i}`]: `%${t}%` }), {})
    );

  qb.orderBy("blog.createdAt", "DESC").take(limit);
  let blogs = await qb.getMany();

  // 3) If not enough, fallback to general recent blogs
  if (blogs.length < limit) {
    const fallbackQb = blogRepo
      .createQueryBuilder("blog")
      .where("blog.status = :status", { status: BlogStatus.ACCEPTED })
      .andWhere("blog.id != :id", { id: currentBlogId })
      .orderBy("blog.createdAt", "DESC")
      .take(limit);

    const fallback = await fallbackQb.getMany();

    // Merge + dedupe (by ID), maintaining order
    const seen = new Set();
    blogs = [...blogs, ...fallback]
      .filter((b) => {
        if (b.id === currentBlogId) return false; // <-- force exclude current blog
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      })
      .slice(0, limit);
  }

  // 4) Fetch author names in one query
  const authorIds = [...new Set(blogs.map((b) => b.authorId))];
  const authorMap = await fetchAuthorsMap(authorIds);

  return blogs.map((b) => ({
    ...b,
    author: b.authorId
      ? { id: b.authorId, name: authorMap[b.authorId] ?? "مؤلف مجهول" }
      : undefined,
  }));
};
