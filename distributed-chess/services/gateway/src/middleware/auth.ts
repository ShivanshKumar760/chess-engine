import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
};

export const generateToken = (userId: string, username: string): string => {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): { userId: string; username: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
  } catch {
    return null;
  }
};
