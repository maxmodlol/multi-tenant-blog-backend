// src/controller/userController.ts
import { Request, Response, NextFunction } from "express";
import {  getAllUsers, getUserById, updateUser, deleteUser } from "../services/userService";


export const getAllUsersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updatedUser = await updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
