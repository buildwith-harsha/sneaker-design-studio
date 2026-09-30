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
  name: string;
  model: string;
  components: DesignComponents;
  materials: DesignMaterials;
  created_at: string;
  updated_at: string;
}

export type CreateDesign = Omit<Design, "id" | "created_at" | "updated_at">;

export type UpdateDesign = Omit<Design, "created_at" | "updated_at">;
