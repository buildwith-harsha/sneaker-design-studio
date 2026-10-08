export interface DesignComponents {
  upper: string;
  heel: string;
  tongue: string;
  midsole: string;
  outsole: string;
  laces: string;
  toe: string;
  logo: string;
}

export interface DesignMaterials {
  upper: string;
  heel: string;
  tongue: string;
  midsole: string;
  outsole: string;
  laces: string;
  toe: string;
  logo: string;
}

export interface Design {
  id: number;
  user_id: number;
  name: string;
  model: string;
  components: DesignComponents;
  materials: DesignMaterials;
  created_at: string;
  updated_at: string;
}

export interface DesignVersion {
  id: number;
  design_id: number;
  version_number: number;
  name: string;
  model: string;
  components: DesignComponents;
  materials: DesignMaterials;
  change_summary: string;
  created_at: string;
}

export type CreateDesign = Omit<Design, "id" | "created_at" | "updated_at">;

export type UpdateDesign = Omit<Design, "created_at" | "updated_at"> & {
  change_summary?: string;
};

export interface DesignQueryOptions {
  search?: string;
  model?: string;
  sort?: "newest" | "oldest" | "name_asc" | "name_desc" | "updated";
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedDesigns {
  designs: Design[];
  pagination: PaginationMeta;
}
