import type {
  Design,
  DesignComponents,
  DesignMaterials,
  DesignVersion,
} from "../types/design.js";

export interface DesignModelData {
  id: number;
  user_id: number;
  name: string;
  model: string;
  components: DesignComponents | string;
  materials: DesignMaterials | string;
  created_at: string;
  updated_at: string;
}

export interface DesignVersionModelData {
  id: number;
  design_id: number;
  version_number: number;
  name: string;
  model: string;
  components: DesignComponents | string;
  materials: DesignMaterials | string;
  change_summary: string;
  created_at: string;
}

export class DesignModel {
  id: number;
  user_id: number;
  name: string;
  model: string;
  components: DesignComponents;
  materials: DesignMaterials;
  createdAt: string;
  updatedAt: string;

  constructor(data: DesignModelData) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.model = data.model;

    this.components =
      typeof data.components === "string"
        ? JSON.parse(data.components)
        : data.components;

    this.materials =
      typeof data.materials === "string"
        ? JSON.parse(data.materials)
        : data.materials;

    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON(): Design {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name,
      model: this.model,
      components: this.components,
      materials: this.materials,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  toFrontendJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name,
      model: this.model,
      components: this.components,
      materials: this.materials,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class DesignVersionModel {
  id: number;
  designId: number;
  versionNumber: number;
  name: string;
  model: string;
  components: DesignComponents;
  materials: DesignMaterials;
  changeSummary: string;
  createdAt: string;

  constructor(data: DesignVersionModelData) {
    this.id = data.id;
    this.designId = data.design_id;
    this.versionNumber = data.version_number;
    this.name = data.name;
    this.model = data.model;

    this.components =
      typeof data.components === "string"
        ? JSON.parse(data.components)
        : data.components;

    this.materials =
      typeof data.materials === "string"
        ? JSON.parse(data.materials)
        : data.materials;

    this.changeSummary = data.change_summary || "Design update";
    this.createdAt = data.created_at;
  }

  toJSON(): DesignVersion {
    return {
      id: this.id,
      design_id: this.designId,
      version_number: this.versionNumber,
      name: this.name,
      model: this.model,
      components: this.components,
      materials: this.materials,
      change_summary: this.changeSummary,
      created_at: this.createdAt,
    };
  }
}
