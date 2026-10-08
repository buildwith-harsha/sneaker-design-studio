import type { Request, Response } from "express";
import { DesignService } from "../services/designService.js";
import type { DesignQueryOptions } from "../types/design.js";

export class DesignController {
  private designService: DesignService;

  constructor() {
    this.designService = new DesignService();
  }

  async getAllDesigns(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const options: DesignQueryOptions = {
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        model: typeof req.query.model === "string" ? req.query.model : undefined,
        sort: typeof req.query.sort === "string" ? (req.query.sort as DesignQueryOptions["sort"]) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 8,
      };

      const result = await this.designService.getDesigns(req.user.id, options);

      res.status(200).json({
        success: true,
        data: result.designs.map((d) => d.toFrontendJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error in getAllDesigns:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch designs.",
      });
    }
  }

  async getDesignById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid design ID." });
        return;
      }

      const design = await this.designService.getDesignById(id, req.user.id);

      res.status(200).json({
        success: true,
        data: design.toFrontendJSON(),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Design not found.",
      });
    }
  }

  async createDesign(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const { name, model, components, materials } = req.body;
      const design = await this.designService.createDesign(req.user.id, {
        name,
        model,
        components,
        materials,
      });

      res.status(201).json({
        success: true,
        data: design.toFrontendJSON(),
      });
    } catch (error) {
      console.error("Error in createDesign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create design.",
      });
    }
  }

  async updateDesign(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid design ID." });
        return;
      }

      const design = await this.designService.updateDesign(
        id,
        req.user.id,
        req.body,
      );

      res.status(200).json({
        success: true,
        data: design.toFrontendJSON(),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Design not found or update failed.",
      });
    }
  }

  async deleteDesign(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid design ID." });
        return;
      }

      await this.designService.deleteDesign(id, req.user.id);

      res.status(204).send();
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Design not found.",
      });
    }
  }

  async getVersions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid design ID." });
        return;
      }

      const versions = await this.designService.getDesignVersions(
        id,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: versions.map((v) => v.toJSON()),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Design versions not found.",
      });
    }
  }

  async restoreVersion(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const id = Number(req.params.id);
      const versionNumber = Number(req.params.versionNumber);

      if (isNaN(id) || isNaN(versionNumber)) {
        res.status(400).json({
          success: false,
          message: "Invalid design ID or version number.",
        });
        return;
      }

      const design = await this.designService.restoreDesignVersion(
        id,
        versionNumber,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: design.toFrontendJSON(),
        message: `Successfully restored to Version ${versionNumber}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to restore version.";
      res.status(404).json({
        success: false,
        message,
      });
    }
  }
}
