import { Router } from "express";
import {
  getDashboardBlogsController,
  getDashboardBlogByIdController,
  createBlogController,
  updateBlogController,
  updateBlogStatusController,
  deleteBlogController,
  uploadImageController,
} from "../controller/blogController";
import { jwtAuth } from "../middleware/jwtAuth";
import { upload } from "../middleware/upload";

const dash = Router();

dash.use(jwtAuth()); // protect everything below

// LIST blogs
dash.get("/", getDashboardBlogsController); // GET    /api/dashboard/blogs

// CREATE blog
dash.post("/", upload.single("coverPhoto"), createBlogController); // POST   /api/dashboard/blogs

// SINGLE blog operations
dash.get("/:id", getDashboardBlogByIdController); // GET    /api/dashboard/blogs/:id
dash.patch("/:id", updateBlogController); // PATCH  /api/dashboard/blogs/:id
dash.patch("/:id/status", updateBlogStatusController); // PATCH  /api/dashboard/blogs/:id/status
dash.delete("/:id", deleteBlogController); // DELETE /api/dashboard/blogs/:id

// UPLOAD image (keep **before** any "/:id" POST routes to avoid conflicts)
dash.post("/upload-image", upload.single("file"), uploadImageController);

export default dash;
