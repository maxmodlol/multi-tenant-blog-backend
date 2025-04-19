import { Router } from "express";
import {
  createBlogController,
  getAllBlogsController,
  getBlogByIdController,
  updateBlogController,
  deleteBlogController,
  updateBlogStatusController,
  searchBlogsController,
  getRelatedBlogsController,
} from "../controller/blogController";
import { jwtAuth } from "../middleware/jwtAuth";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/", upload.single("coverPhoto"), createBlogController);
router.get("/", getAllBlogsController);
router.get("/search", searchBlogsController);
router.get("/:id", getBlogByIdController);
router.patch("/:id", jwtAuth, updateBlogController);
router.patch("/:id/status", jwtAuth, updateBlogStatusController);
router.get("/:id/related", getRelatedBlogsController);

router.delete("/:id", jwtAuth, deleteBlogController);

export default router;
