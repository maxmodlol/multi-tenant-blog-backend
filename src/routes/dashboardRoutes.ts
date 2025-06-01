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

//—all dashboard routes require auth
dash.use(jwtAuth());

dash.get("/", getDashboardBlogsController);
dash.get("/:id", getDashboardBlogByIdController);
dash.post("/", upload.single("coverPhoto"), createBlogController);

dash.patch("/:id", updateBlogController);
dash.patch("/:id/status", updateBlogStatusController);
dash.delete("/:id", deleteBlogController);
dash.post("/upload-image", upload.single("file"), uploadImageController);
export default dash;
