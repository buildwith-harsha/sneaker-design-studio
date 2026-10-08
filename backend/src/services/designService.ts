import { DesignRepository } from "../repositories/designRepository.js";
import { DesignModel, DesignVersionModel } from "../models/designModel.js";
import type {
  CreateDesign,
  UpdateDesign,
  DesignQueryOptions,
  PaginationMeta,
} from "../types/design.js";

export class DesignService {
  private designRepository: DesignRepository;

  constructor() {
    this.designRepository = new DesignRepository();
  }

  async getDesigns(
    userId: number,
    options: DesignQueryOptions = {},
  ): Promise<{ designs: DesignModel[]; pagination: PaginationMeta }> {
    return this.designRepository.findPaginated(userId, options);
  }

  async getDesignById(id: number, userId: number): Promise<DesignModel> {
    const design = await this.designRepository.findById(id, userId);

    if (!design) {
      throw new Error("Design not found or access denied.");
    }

    return design;
  }

  async createDesign(
    userId: number,
    design: Omit<CreateDesign, "user_id">,
  ): Promise<DesignModel> {
    return this.designRepository.create(
      userId,
      design.name,
      design.model,
      design.components,
      design.materials,
    );
  }

  async updateDesign(
    id: number,
    userId: number,
    design: Partial<UpdateDesign>,
  ): Promise<DesignModel> {
    const existing = await this.designRepository.findById(id, userId);

    if (!existing) {
      throw new Error("Design not found or access denied.");
    }

    const name = design.name !== undefined ? design.name : existing.name;
    const model = design.model !== undefined ? design.model : existing.model;
    const components =
      design.components !== undefined
        ? design.components
        : existing.components;
    const materials =
      design.materials !== undefined ? design.materials : existing.materials;
    const changeSummary = design.change_summary;

    const updated = await this.designRepository.update(
      id,
      userId,
      name,
      model,
      components,
      materials,
      changeSummary,
    );

    if (!updated) {
      throw new Error("Failed to update design.");
    }

    return updated;
  }

  async deleteDesign(id: number, userId: number): Promise<boolean> {
    const deleted = await this.designRepository.delete(id, userId);

    if (!deleted) {
      throw new Error("Design not found or access denied.");
    }

    return true;
  }

  async getDesignVersions(
    designId: number,
    userId: number,
  ): Promise<DesignVersionModel[]> {
    return this.designRepository.getVersions(designId, userId);
  }

  async restoreDesignVersion(
    designId: number,
    versionNumber: number,
    userId: number,
  ): Promise<DesignModel> {
    return this.designRepository.restoreVersion(
      designId,
      versionNumber,
      userId,
    );
  }
}
