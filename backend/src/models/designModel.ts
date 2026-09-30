import type {
  Design,
  DesignComponents,
  DesignMaterials,
} from "../types/design.js";

export class DesignModel {
  id: number;
  name: string;
  model: string;
  components: DesignComponents;
  materials: DesignMaterials;
  createdAt: string;
  updatedAt: string;

  constructor(data: Design) {
    this.id = data.id;
    this.name = data.name;
    this.model = data.model;
    this.components = data.components;
    this.materials = data.materials;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
