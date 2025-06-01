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
} from "../services/blogService";
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

    const blogs = await getAllBlogs(tenant, page, limit, categorySlug);

    res.status(200).json(blogs);
  } catch (error) {
    next(error);
  }
};
export const getDashboardBlogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      typeof req.query.category === "string" ? req.query.category : undefined;
    const statusesParam = (req.query.statuses as string) ?? "";
    const statuses: BlogStatus[] = statusesParam
      ? (statusesParam.split(",") as BlogStatus[])
      : [];
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    // 2. Tenant selection
    //    - Admins may override via ?tenant=all or ?tenant=foo
    //    - Everyone else is locked to their own
    let tenantFilter: string;
    if (user.role === "ADMIN") {
      tenantFilter = (req.query.tenant as string) || "all";
      console.log("tenant filter", tenantFilter);
    } else {
      tenantFilter = user.tenant;
    }

    // 3. Fetch
    const result = await getDashboardBlogs(
      tenantFilter,
      page,
      limit,
      category,
      statuses,
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
    const blog = await getBlogById(tenant, id);

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
    const updateData = req.body;
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
    await deleteBlog(tenant, req.params.id);
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
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }
    const results = await searchBlogs(q);
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
    console.log("tenant ", tenant);
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
