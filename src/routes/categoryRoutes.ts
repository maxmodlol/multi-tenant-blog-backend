import { Router } from "express";
import {
  createCategoryController,
  getAllCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from "../controller/categoryController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

router.post("/", jwtAuth(), createCategoryController);
router.get("/", getAllCategoriesController);
router.get("/:id", jwtAuth(), getCategoryByIdController);
router.put("/:id", jwtAuth(), updateCategoryController);
router.delete("/:id", jwtAuth(), deleteCategoryController);

export default router;
