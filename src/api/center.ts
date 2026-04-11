import { apiClient } from './client'

export interface ControllerSummary {
  controller_id: string
  cluster: string
  env: string[]
  tag: string[]
  online: boolean
  last_list_secs_ago: number | null
  key_count: number
}

export const centerApi = {
  listControllers: async (): Promise<{ success: boolean; data?: ControllerSummary[]; count: number }> => {
    const { data } = await apiClient.get('controllers')
    return data
  },
  listClusters: async (): Promise<{ success: boolean; data?: string[]; count: number }> => {
    const { data } = await apiClient.get('clusters')
    return data
  },
  reloadController: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post(`controllers/${encodeURIComponent(id)}/reload`)
    return data
  },
}
