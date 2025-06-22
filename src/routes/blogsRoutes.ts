import { Router } from "express";
import {
  getAllBlogsController,
  getPublicBlogByIdController,
  searchBlogsController,
  getRelatedBlogsController,
} from "../controller/blogController";

const publicRouter = Router();

// List & search (approved only)
publicRouter.get("/", getAllBlogsController);
publicRouter.get("/search", searchBlogsController);

// Single post (must be ACCEPTED)
publicRouter.get("/:id", getPublicBlogByIdController);

// Related posts (only approved)
publicRouter.get("/:id/related", getRelatedBlogsController);

export default publicRouter;
