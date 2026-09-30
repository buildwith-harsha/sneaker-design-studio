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
