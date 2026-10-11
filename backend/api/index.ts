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

  return app(req, res);
}
