import { Request, Response, NextFunction } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  searchBlogs,
  updateBlogStatus,
  getRelatedBlogs,
  getDashboardBlogs,
  getAnyTenantBlogById,
  getApprovedPublicBlogById,
} from "../services/blogService";
import { removeBlogIndex } from "../services/globalBlogIndexService";
import { BlogStatus, CreateBlogInput, MulterS3File } from "../types/blogsType";

export const createBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, tags, categoryNames } = req.body;
    let { pages } = req.body; // pages might be a string
    const authorId = req.body.authorId;
    const tenant = (req as any).tenant || "main";

    if (!title || !pages || !authorId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Ensure pages is an array:
    if (typeof pages === "string") {
      try {
        pages = JSON.parse(pages);
        if (!Array.isArray(pages)) {
          throw new Error();
        }
      } catch (err) {
        console.log("error Occuerd ", err);
      }
    }

    // If a file was uploaded, use its S3 URL; otherwise, fall back to any coverPhoto text value.
    const file = req.file as MulterS3File | undefined;
    const coverPhoto = file?.location || req.body.coverPhoto;

    const input: CreateBlogInput = {
      title,
      coverPhoto,
      tags: typeof tags === "string" ? JSON.parse(tags) : tags, // optional: parse tags if necessary
      categoryNames:
        typeof categoryNames === "string"
          ? JSON.parse(categoryNames)
          : categoryNames,
      pages,
      description: req.body.description,
      authorId,
      tenant,
    };

    const blog = await createBlog(input);
    res.status(201).json(blog);
  } catch (error) {
    next(error);
  }
};
export const getAllBlogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant || "main";

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 9;
    const categorySlug = req.query.category as string | undefined;

    // Decode URL-encoded category name for proper Arabic character handling
    const decodedCategorySlug = categorySlug
      ? decodeURIComponent(categorySlug)
      : undefined;

    console.log(
      "Backend getAllBlogsController - categorySlug (encoded):",
      categorySlug
    );
    console.log(
      "Backend getAllBlogsController - decodedCategorySlug:",
      decodedCategorySlug
    );
    console.log(
      "Backend getAllBlogsController - decodedCategorySlug type:",
      typeof decodedCategorySlug
    );
    console.log(
      "Backend getAllBlogsController - decodedCategorySlug length:",
      decodedCategorySlug?.length
    );
    console.log(
      "Backend getAllBlogsController - decodedCategorySlug char codes:",
      decodedCategorySlug
        ? Array.from(decodedCategorySlug).map((c) => c.charCodeAt(0))
        : "undefined"
    );
    console.log("Backend getAllBlogsController - tenant:", tenant);
    console.log(
      "Backend getAllBlogsController - host header:",
      req.headers.host
    );
    console.log(
      "Backend getAllBlogsController - x-tenant header:",
      req.headers["x-tenant"]
    );
    console.log("Backend getAllBlogsController - full URL:", req.url);
    console.log("Backend getAllBlogsController - query params:", req.query);

    const blogs = await getAllBlogs(tenant, page, limit, decodedCategorySlug);

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Backend getAllBlogsController - Error:", error);
    next(error);
  }
};
export const getDashboardBlogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // 1. Paging & filters
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 9;
    const category =
      typeof req.query.category === "string"
        ? decodeURIComponent(req.query.category)
        : undefined;

    // ONLY ONE STATUS FILTER, not an array
    const statusParam =
      typeof req.query.status === "string" ? req.query.status : undefined;
    let statusFilter: BlogStatus | undefined = undefined;
    if (statusParam) {
      // validate against the enum (optional)
      if (Object.values(BlogStatus).includes(statusParam as BlogStatus)) {
        statusFilter = statusParam as BlogStatus;
      } else {
        return res.status(400).json({ error: "Invalid status value" });
      }
    }

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    // 2. Tenant selection
    let tenantFilter: string;
    if (user.role === "ADMIN") {
      tenantFilter = (req.query.tenant as string) || "all";
    } else {
      tenantFilter = user.tenant;
    }

    // 3. Fetch (pass a single statusFilter)
    const result = await getDashboardBlogs(
      tenantFilter,
      page,
      limit,
      category,
      statusFilter,
      search
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};
export const getPublicBlogByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const tenant = (req as any).tenant || "main";
    console.log("tenant", tenant);
    const blog = await getApprovedPublicBlogById(tenant, id);

    res.json(blog); // <-- no `return` here
  } catch (err) {
    next(err);
  }
};
export const uploadImageController = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const file = req.file as MulterS3File | undefined;
    if (!file || typeof file.location !== "string") {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    // send back the S3 URL
    res.status(200).json({ url: file.location });
  } catch (error) {
    next(error);
  }
};

/**
 * Dashboard (authenticated) fetch by ID, picks up tenant from req.user or falls back
 */
export const getDashboardBlogByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { id } = req.params;
    let blog;
    if (user.role === "ADMIN") {
      blog = await getAnyTenantBlogById(id);
    } else {
      blog = await getBlogById(user.tenant, id);
    }

    res.json(blog);
  } catch (err) {
    next(err);
  }
};

export const updateBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant || "main";
    // Normalize incoming body similar to create controller
    const updateData: any = { ...req.body };
    if (typeof updateData.pages === "string") {
      try {
        updateData.pages = JSON.parse(updateData.pages);
      } catch (error) {
        console.error("JSON parse error:", error);
      }
    }
    if (typeof updateData.tags === "string") {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (error) {
        console.error("JSON parse error:", error);
      }
    }
    if (typeof updateData.categoryNames === "string") {
      try {
        updateData.categoryNames = JSON.parse(updateData.categoryNames);
      } catch (error) {
        console.error("JSON parse error:", error);
      }
    }
    const blog = await updateBlog(tenant, req.params.id, updateData);
    res.status(200).json(blog);
  } catch (error) {
    next(error);
  }
};

export const deleteBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant || "main";
    const id = req.params.id;
    await deleteBlog(tenant, id);
    // also remove from global index if present
    try {
      await removeBlogIndex(id, tenant);
    } catch {}
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const searchBlogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // q: search string (optional → if empty, return all)
    // tenant: tenant slug (optional → if provided, filter by tenant)
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const tenant =
      typeof req.query.tenant === "string" ? req.query.tenant : undefined;

    const results = await searchBlogs(q, tenant);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};
export const updateBlogStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant: string = (req as any).tenant || "main";
    const { status } = req.body;
    const { id } = req.params;
    console.log("id ", status);
    if (!status) {
      res.status(400).json({ error: "Status is required" });
      return;
    }

    const updatedBlog = await updateBlogStatus(tenant, id, status);
    res.status(200).json(updatedBlog);
  } catch (error) {
    next(error);
  }
};
export const getRelatedBlogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenant = (req as any).tenant || "main";
    const { id } = req.params;

    const related = await getRelatedBlogs(tenant, id, 4);
    res.json(related);
  } catch (error) {
    next(error);
  }
};
