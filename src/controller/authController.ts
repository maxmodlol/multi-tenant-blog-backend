// src/controller/authController.ts
import { Request, Response, NextFunction } from "express";
import { createUser } from "../services/userService";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Role } from "../types/UserTypes";
import { getTenantDataSource } from "../config/tenantDataSource";
import { User } from "../models/User";

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, subdomain } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // For publishers, ensure a subdomain is provided and initialize the tenant DataSource.
    if (role === Role.PUBLISHER) {
      if (!subdomain) {
        res.status(400).json({ error: "Publisher registration requires a subdomain" });
        return;
      }
      await getTenantDataSource(subdomain);
      // Optionally, you might store the subdomain in the user record as well.
    }

    // Create the user (global user stored in AppDataSource)
    const user = await createUser({ name, email, password, role });

    // Generate a JWT token for the new user.
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Use the shared AppDataSource to get the repository.
    const userRepository = (await import("../config/data-source")).AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate a JWT token for the user.
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};
