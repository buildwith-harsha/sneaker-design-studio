import api from "./api";
import type {
  SavedDesign,
  DesignVersion,
  DesignFilters,
  PaginatedDesignsResponse,
} from "../store/DesignTypes";

export type CreateDesignData = Omit<
  SavedDesign,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateDesignData = Omit<SavedDesign, "createdAt" | "updatedAt"> & {
  change_summary?: string;
};

interface BackendResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

export async function getDesigns(
  filters: DesignFilters = {},
): Promise<PaginatedDesignsResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.model && filters.model !== "all") params.append("model", filters.model);
  if (filters.sort) params.append("sort", filters.sort);
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));

  const response = await api.get<BackendResponse<SavedDesign[]>>(
    `/designs?${params.toString()}`,
  );

  return {
    designs: response.data.data || [],
    pagination: response.data.pagination || {
      page: 1,
      limit: filters.limit || 8,
      total: response.data.data?.length || 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export async function getDesignById(id: number): Promise<SavedDesign> {
  const response = await api.get<BackendResponse<SavedDesign>>(`/designs/${id}`);
  return response.data.data;
}

export async function createDesign(
  design: CreateDesignData,
): Promise<SavedDesign> {
  const response = await api.post<BackendResponse<SavedDesign>>("/designs", design);
  return response.data.data;
}

export async function updateDesign(
  id: number,
  design: UpdateDesignData,
): Promise<SavedDesign> {
  const response = await api.put<BackendResponse<SavedDesign>>(`/designs/${id}`, design);
  return response.data.data;
}

export async function deleteDesign(id: number): Promise<void> {
  await api.delete(`/designs/${id}`);
}

export async function getDesignVersions(id: number): Promise<DesignVersion[]> {
  const response = await api.get<BackendResponse<DesignVersion[]>>(
    `/designs/${id}/versions`,
  );
  return response.data.data || [];
}

export async function restoreDesignVersion(
  id: number,
  versionNumber: number,
): Promise<SavedDesign> {
  const response = await api.post<BackendResponse<SavedDesign>>(
    `/designs/${id}/versions/${versionNumber}/restore`,
  );
  return response.data.data;
}
