import type { Request, Response, NextFunction } from "express";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { name, email, password } = req.body || {};
  const errors: Record<string, string> = {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.email = "Please provide a valid email address.";
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Password must contain both letters and numbers.";
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
    return;
  }

  next();
}

export function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { email, password } = req.body || {};
  const errors: Record<string, string> = {};

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.email = "Email is required.";
  }

  if (!password || typeof password !== "string") {
    errors.password = "Password is required.";
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
    return;
  }

  next();
}

export function validateDesignPayload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { name, model, components, materials } = req.body || {};
  const errors: Record<string, string> = {};

  if (req.method === "POST" || name !== undefined) {
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      errors.name = "Design name cannot be empty.";
    } else if (name.trim().length > 100) {
      errors.name = "Design name cannot exceed 100 characters.";
    }
  }

  if (req.method === "POST" || model !== undefined) {
    if (!model || typeof model !== "string" || model.trim().length < 1) {
      errors.model = "Sneaker model is required.";
    }
  }

  if (req.method === "POST" || components !== undefined) {
    if (!components || typeof components !== "object") {
      errors.components = "Sneaker components map is required.";
    }
  }

  if (req.method === "POST" || materials !== undefined) {
    if (!materials || typeof materials !== "object") {
      errors.materials = "Sneaker materials map is required.";
    }
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Design validation failed.",
      errors,
    });
    return;
  }

  next();
}
