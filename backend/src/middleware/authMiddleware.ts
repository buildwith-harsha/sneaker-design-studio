import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name?: string;
        email?: string;
      };
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Authorization token required.",
      });
      return;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
      return;
    }

    const payload = verifyToken(token);

    req.user = {
      id: payload.userId,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}
