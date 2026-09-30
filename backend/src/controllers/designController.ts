import type { Request, Response } from "express";

import { DesignService } from "../services/designService.js";

export class DesignController {
  private designService: DesignService;

  constructor() {
    this.designService = new DesignService();
  }

  async getAllDesigns(req: Request, res: Response): Promise<void> {
    try {
      const designs = await this.designService.getAllDesigns();

      res.status(200).json(designs);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch designs",
      });
    }
  }

  async getDesignById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const design = await this.designService.getDesignById(id);

      res.status(200).json(design);
    } catch (error) {
      console.error(error);

      res.status(404).json({
        message: "Design not found",
      });
    }
  }

  async createDesign(req: Request, res: Response): Promise<void> {
    try {
      const design = await this.designService.createDesign(req.body);

      res.status(201).json(design);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to create design",
      });
    }
  }

  async updateDesign(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const design = await this.designService.updateDesign(id, req.body);

      res.status(200).json(design);
    } catch (error) {
      console.error(error);

      res.status(404).json({
        message: "Design not found",
      });
    }
  }

  async deleteDesign(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      await this.designService.deleteDesign(id);

      res.status(204).send();
    } catch (error) {
      console.error(error);

      res.status(404).json({
        message: "Design not found",
      });
    }
  }
}
