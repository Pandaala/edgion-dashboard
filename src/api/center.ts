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

export interface RegionDef {
  name: string
  hashRange: [number, number]
  backendEndpoint: string
  tls: boolean
  failoverTo?: string
}

export interface HashCalcConfig {
  algorithm: string
  modulo: number
}

export interface ResourceRef {
  kind: string
  name: string
}

export interface ControllerRouteRef {
  controllerId: string
  resources: ResourceRef[]
}

export interface CenterRegionRouteKey {
  serviceGroup: string
  cluster: string
  namespace: string
  controllers: ControllerRouteRef[]
}

export interface CenterRegionRouteDetailEntry {
  kind: string
  name: string
  httpRoutes: string[]
  baseInfo: {
    serviceGroup: string
    cluster: string
    regions: RegionDef[]
    myRegion: string
  }
  keyGet: unknown[]
  hashKeyGet?: unknown[]
  hashCalc?: HashCalcConfig
  routeRules: unknown[]
  autoFailover?: unknown
}

export interface CenterRegionRouteDetail {
  controllerId: string
  entries: CenterRegionRouteDetailEntry[]
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
    const safeId = id.replace(/\//g, '~')
    const { data } = await apiClient.post(`controllers/${safeId}/reload`)
    return data
  },
  listRegionRoutes: async (params?: { serviceGroup?: string; cluster?: string; namespace?: string; kind?: string }): Promise<{ success: boolean; data?: CenterRegionRouteKey[]; count: number }> => {
    const query = new URLSearchParams()
    if (params?.serviceGroup) query.set('service_group', params.serviceGroup)
    if (params?.cluster) query.set('cluster', params.cluster)
    if (params?.namespace) query.set('namespace', params.namespace)
    if (params?.kind) query.set('kind', params.kind)
    const qs = query.toString()
    const { data } = await apiClient.get(`center/region-routes${qs ? `?${qs}` : ''}`)
    return data
  },
  getRegionRouteDetail: async (serviceGroup: string, cluster: string, namespace: string): Promise<{ success: boolean; data?: CenterRegionRouteDetail[] }> => {
    const { data } = await apiClient.get(`center/region-routes/${serviceGroup}/${cluster}/${namespace}`)
    return data
  },
}
