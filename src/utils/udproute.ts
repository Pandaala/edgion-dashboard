/**
 * UDPRoute 工具函数
 */

import * as yaml from 'js-yaml'
import type { UDPRoute } from '@/types/gateway-api/udproute'

export const DEFAULT_UDPROUTE_YAML = `apiVersion: gateway.networking.k8s.io/v1alpha2
kind: UDPRoute
metadata:
  name: example-udp-route
  namespace: default
spec:
  parentRefs:
    - name: example-gateway
      sectionName: udp-5300
  rules:
    - backendRefs:
        - name: example-service
          port: 5300
`

export function createEmptyUDPRoute(): UDPRoute {
  return {
    apiVersion: 'gateway.networking.k8s.io/v1alpha2',
    kind: 'UDPRoute',
    metadata: {
      name: '',
      namespace: 'default',
    },
    spec: {
      parentRefs: [{ name: '', sectionName: '' }],
      rules: [{ backendRefs: [{ name: '', port: 80 }] }],
    },
  }
}

export function normalizeUDPRoute(raw: any): UDPRoute {
  return {
    apiVersion: raw.apiVersion || 'gateway.networking.k8s.io/v1alpha2',
    kind: 'UDPRoute',
    metadata: {
      name: raw.metadata?.name || '',
      namespace: raw.metadata?.namespace || 'default',
      labels: raw.metadata?.labels,
      annotations: raw.metadata?.annotations,
      resourceVersion: raw.metadata?.resourceVersion,
      creationTimestamp: raw.metadata?.creationTimestamp,
    },
    spec: {
      parentRefs: raw.spec?.parentRefs || [],
      rules: (raw.spec?.rules || []).map((rule: any) => ({
        backendRefs: rule.backendRefs || [],
      })),
    },
    status: raw.status,
  }
}

function removeEmpty(obj: any): any {
  if (Array.isArray(obj)) {
    const arr = obj.map(removeEmpty).filter((v) => v !== null && v !== undefined)
    return arr.length > 0 ? arr : undefined
  }
  if (obj !== null && typeof obj === 'object') {
    const result: any = {}
    for (const [k, v] of Object.entries(obj)) {
      const cleaned = removeEmpty(v)
      if (cleaned !== null && cleaned !== undefined && cleaned !== '') {
        result[k] = cleaned
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }
  return obj
}

export function udpRouteToYaml(route: UDPRoute): string {
  const clean = removeEmpty(route)
  return yaml.dump(clean, { lineWidth: -1, noRefs: true })
}

export function yamlToUDPRoute(yamlStr: string): UDPRoute {
  const raw = yaml.load(yamlStr) as any
  return normalizeUDPRoute(raw)
}
