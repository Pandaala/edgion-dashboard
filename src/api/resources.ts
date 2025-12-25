import { apiClient } from './client'
import type { ApiResponse, ListResponse, K8sResource, ResourceKind } from './types'
import * as yaml from 'js-yaml'

export const resourceApi = {
  /**
   * List all resources of a kind (across all namespaces)
   */
  listAll: async <T extends K8sResource>(kind: ResourceKind): Promise<ListResponse<T>> => {
    const { data } = await apiClient.get(`/namespaced/${kind}`)
    return data
  },

  /**
   * List resources in a specific namespace
   */
  list: async <T extends K8sResource>(
    kind: ResourceKind,
    namespace: string
  ): Promise<ListResponse<T>> => {
    const { data } = await apiClient.get(`/namespaced/${kind}/${namespace}`)
    return data
  },

  /**
   * Get a single resource
   */
  get: async <T extends K8sResource>(
    kind: ResourceKind,
    namespace: string,
    name: string
  ): Promise<T> => {
    const { data } = await apiClient.get(`/namespaced/${kind}/${namespace}/${name}`)
    return data
  },

  /**
   * Create a resource
   */
  create: async <T extends K8sResource>(
    kind: ResourceKind,
    namespace: string,
    resource: T | string
  ): Promise<ApiResponse<string>> => {
    const content = typeof resource === 'string' ? resource : yaml.dump(resource)
    const { data } = await apiClient.post(`/namespaced/${kind}/${namespace}`, content, {
      headers: { 'Content-Type': 'application/yaml' },
    })
    return data
  },

  /**
   * Update a resource
   */
  update: async <T extends K8sResource>(
    kind: ResourceKind,
    namespace: string,
    name: string,
    resource: T | string
  ): Promise<ApiResponse<string>> => {
    const content = typeof resource === 'string' ? resource : yaml.dump(resource)
    const { data } = await apiClient.put(`/namespaced/${kind}/${namespace}/${name}`, content, {
      headers: { 'Content-Type': 'application/yaml' },
    })
    return data
  },

  /**
   * Delete a resource
   */
  delete: async (
    kind: ResourceKind,
    namespace: string,
    name: string
  ): Promise<ApiResponse<string>> => {
    const { data } = await apiClient.delete(`/namespaced/${kind}/${namespace}/${name}`)
    return data
  },

  /**
   * Batch delete resources
   */
  batchDelete: async (
    kind: ResourceKind,
    resources: Array<{ namespace: string; name: string }>
  ): Promise<void> => {
    await Promise.all(
      resources.map((r) => resourceApi.delete(kind, r.namespace, r.name))
    )
  },
}

// Cluster-scoped resources API
export const clusterResourceApi = {
  listAll: async <T extends K8sResource>(kind: ResourceKind): Promise<ListResponse<T>> => {
    const { data } = await apiClient.get(`/cluster/${kind}`)
    return data
  },

  get: async <T extends K8sResource>(kind: ResourceKind, name: string): Promise<T> => {
    const { data } = await apiClient.get(`/cluster/${kind}/${name}`)
    return data
  },

  create: async <T extends K8sResource>(
    kind: ResourceKind,
    resource: T | string
  ): Promise<ApiResponse<string>> => {
    const content = typeof resource === 'string' ? resource : yaml.dump(resource)
    const { data } = await apiClient.post(`/cluster/${kind}`, content, {
      headers: { 'Content-Type': 'application/yaml' },
    })
    return data
  },

  update: async <T extends K8sResource>(
    kind: ResourceKind,
    name: string,
    resource: T | string
  ): Promise<ApiResponse<string>> => {
    const content = typeof resource === 'string' ? resource : yaml.dump(resource)
    const { data } = await apiClient.put(`/cluster/${kind}/${name}`, content, {
      headers: { 'Content-Type': 'application/yaml' },
    })
    return data
  },

  delete: async (kind: ResourceKind, name: string): Promise<ApiResponse<string>> => {
    const { data } = await apiClient.delete(`/cluster/${kind}/${name}`)
    return data
  },
}

