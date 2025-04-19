import { Request, Response, NextFunction } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";

export const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    // Extract tenant from request (set by tenantMiddleware). Default to "main" if missing.
    const tenant: string = (req as any).tenant || "main";
    const category = await createCategory(tenant, name);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const getAllCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant: string = (req as any).tenant || "main";
    const categories = await getAllCategories(tenant);
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant: string = (req as any).tenant || "main";
    const category = await getCategoryById(tenant, req.params.id);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    const tenant: string = (req as any).tenant || "main";
    const category = await updateCategory(tenant, req.params.id, name);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant: string = (req as any).tenant || "main";
    await deleteCategory(tenant, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
