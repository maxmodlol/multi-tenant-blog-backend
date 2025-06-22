import { Category } from "../models/Category";
import { ApiError } from "../utils/ApiError";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";

export const createCategory = async (
  tenant: string,
  name: string,
): Promise<Category> => {
  try {
    const categoryRepo = await getRepositoryForTenant(Category, tenant);

    const existing = await categoryRepo.findOne({ where: { name } });
    if (existing) {
      throw new ApiError(400, "Category already exists");
    }

    const category = categoryRepo.create({ name });
    await categoryRepo.save(category);
    return category;
  } catch (error) {
    throw error; // Let the controller catch this error
  }
};

export const getAllCategories = async (tenant: string): Promise<Category[]> => {
  try {
    const categoryRepo = await getRepositoryForTenant(Category, tenant);
    return await categoryRepo.find();
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (
  tenant: string,
  id: string,
): Promise<Category> => {
  try {
    const categoryRepo = await getRepositoryForTenant(Category, tenant);
    const category = await categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  } catch (error) {
    throw error;
  }
};

export const updateCategory = async (
  tenant: string,
  id: string,
  name: string,
): Promise<Category> => {
  try {
    const categoryRepo = await getRepositoryForTenant(Category, tenant);
    const category = await categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    const existing = await categoryRepo.findOne({ where: { name } });
    if (existing && existing.id !== id) {
      throw new ApiError(400, "Category with this name already exists");
    }
    category.name = name;
    await categoryRepo.save(category);
    return category;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (
  tenant: string,
  id: string,
): Promise<void> => {
  const categoryRepo = await getRepositoryForTenant(Category, tenant);

  // load the category with its blogs
  const category = await categoryRepo.findOne({
    where: { id },
    relations: ["blogs"],
  });
  if (!category) throw new ApiError(404, "Category not found");

  // detach all blog relations
  if (category.blogs.length) {
    await categoryRepo
      .createQueryBuilder()
      .relation(Category, "blogs")
      .of(category)
      .remove(category.blogs.map((b) => b.id));
  }

  // now it's safe to delete the category row
  const result = await categoryRepo.delete(id);
  if (result.affected === 0) {
    throw new ApiError(404, "Category not found");
  }
};
