import api from "./api";

import type { SavedDesign } from "../store/DesignTypes";

export type CreateDesignData = Omit<
  SavedDesign,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateDesignData = Omit<SavedDesign, "createdAt" | "updatedAt">;

export async function getDesigns(): Promise<SavedDesign[]> {
  const response = await api.get<SavedDesign[]>("/designs");

  return response.data;
}

export async function getDesignById(id: number): Promise<SavedDesign> {
  const response = await api.get<SavedDesign>(`/designs/${id}`);

  return response.data;
}

export async function createDesign(
  design: CreateDesignData,
): Promise<SavedDesign> {
  const response = await api.post<SavedDesign>("/designs", design);

  return response.data;
}

export async function updateDesign(
  id: number,
  design: UpdateDesignData,
): Promise<SavedDesign> {
  const response = await api.put<SavedDesign>(`/designs/${id}`, design);

  return response.data;
}

export async function deleteDesign(id: number): Promise<void> {
  await api.delete(`/designs/${id}`);
}
