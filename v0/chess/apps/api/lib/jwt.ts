import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/shared/constants";

export const signJwt = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

export const decodeJwt = (token: string) => {
  return jwt.decode(token);
};

export const verifyJwt = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
