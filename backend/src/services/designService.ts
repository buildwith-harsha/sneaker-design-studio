import { DesignRepository } from "../repositories/designRepository.js";

import { DesignModel } from "../models/designModel.js";

import type { CreateDesign, UpdateDesign } from "../types/design.js";

export class DesignService {
  private designRepository: DesignRepository;

  constructor() {
    this.designRepository = new DesignRepository();
  }

  async getAllDesigns(): Promise<DesignModel[]> {
    return this.designRepository.findAll();
  }

  async getDesignById(id: number): Promise<DesignModel> {
    return this.designRepository.findById(id);
  }

  async createDesign(design: CreateDesign): Promise<DesignModel> {
    return this.designRepository.create(design);
  }

  async updateDesign(id: number, design: UpdateDesign): Promise<DesignModel> {
    return this.designRepository.update(id, design);
  }

  async deleteDesign(id: number): Promise<void> {
    return this.designRepository.delete(id);
  }
}
