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
} from "../services/blogService";
import { CreateBlogInput, MulterS3File } from "../types/blogsType";

export const createBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, tags, categoryNames } = req.body;
    let { pages } = req.body; // pages might be a string
    const authorId = req.user ? req.user.id : req.body.authorId;
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

export const getBlogByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant || "main";
    const blog = await getBlogById(tenant, req.params.id);
    res.status(200).json(blog);
  } catch (error) {
    next(error);
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
    const { status } = req.body;
    const { id } = req.params;

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
