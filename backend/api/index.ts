import type { Request, Response } from "express";
import app from "../src/app.js";
import { initDatabase } from "../src/config/initDb.js";

let isDbInitialized = false;

export default async function handler(req: Request, res: Response) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error("Failed to initialize database tables:", err);
    }
  }

  // If Vercel internal rewrite changed req.url to destination, restore the actual requested path
  const originalPath =
    (req.headers["x-forwarded-uri"] as string) ||
    (req.headers["x-original-url"] as string) ||
    req.url;

  if (originalPath && req.url !== originalPath) {
    req.url = originalPath;
  }

  return app(req, res);
}
