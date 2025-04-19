// src/middleware/jwtAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define the payload type you expect in your token
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const jwtAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: "Invalid authorization format. Use 'Bearer <token>'" });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
