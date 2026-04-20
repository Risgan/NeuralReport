import type {
  BaseCatalogsResponse,
  Month,
  Param,
  Status,
  Year,
} from "@/models/catalogs"

import { apiClient } from "@/services/api-client"

export const catalogsService = {
  getYears(): Promise<Year[]> {
    return apiClient.get<Year[]>("/catalogs/years")
  },

  createYear(year: number): Promise<Year> {
    return apiClient.post<Year>(`/catalogs/years?year=${encodeURIComponent(String(year))}`)
  },

  getMonths(): Promise<Month[]> {
    return apiClient.get<Month[]>("/catalogs/months")
  },

  getParams(): Promise<Param[]> {
    return apiClient.get<Param[]>("/catalogs/params")
  },

  getStatus(): Promise<Status[]> {
    return apiClient.get<Status[]>("/catalogs/status")
  },

  getBaseCatalogs(): Promise<BaseCatalogsResponse> {
    return apiClient.get<BaseCatalogsResponse>("/catalogs/base")
  },
}
