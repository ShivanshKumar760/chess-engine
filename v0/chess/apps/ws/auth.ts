import { JWT_SECRET } from "@repo/shared/constants";
import jwt from "jsonwebtoken";

const PORT = 8080;

export const verifyJwt = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const extractToken = (url: string): string | null => {
  return new URL(`http://localhost:${PORT}${url}`).searchParams.get("token");
};
