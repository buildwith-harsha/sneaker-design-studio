import type { SneakerModel } from "../data/sneakerModels";
import type { SneakerMaterial } from "../data/materials";
import type { SneakerComponent } from "./DesignSlice";

export interface SavedDesign {
  id: number;
  name: string;
  model: SneakerModel;
  components: Record<SneakerComponent, string>;
  materials: Record<SneakerComponent, SneakerMaterial>;
  createdAt: string;
  updatedAt: string;
}

export interface DesignVersion {
  id: number;
  design_id: number;
  version_number: number;
  name: string;
  model: SneakerModel;
  components: Record<SneakerComponent, string>;
  materials: Record<SneakerComponent, SneakerMaterial>;
  change_summary: string;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedDesignsResponse {
  designs: SavedDesign[];
  pagination: PaginationMeta;
}

export interface DesignFilters {
  search?: string;
  model?: string;
  sort?: "newest" | "oldest" | "name_asc" | "name_desc" | "updated";
  page?: number;
  limit?: number;
}
