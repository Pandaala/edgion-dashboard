import * as yaml from 'js-yaml'
import type { LinkSys } from '@/types/link-sys'

export const DEFAULT_YAML = `apiVersion: edgion.io/v1
kind: LinkSys
metadata:
  name: redis-cluster
  namespace: default
spec:
  type: redis
  redis:
    addresses:
      - "127.0.0.1:6379"
    database: 0
    clusterMode: false
`

export function createEmpty(): LinkSys {
  return {
    apiVersion: 'edgion.io/v1',
    kind: 'LinkSys',
    metadata: { name: '', namespace: 'default' },
    spec: { type: 'redis', redis: { addresses: [], database: 0, clusterMode: false } },
  }
}

export function normalize(raw: any): LinkSys {
  return {
    apiVersion: raw.apiVersion || 'edgion.io/v1',
    kind: 'LinkSys',
    metadata: {
      name: raw.metadata?.name || '',
      namespace: raw.metadata?.namespace || 'default',
      labels: raw.metadata?.labels,
      annotations: raw.metadata?.annotations,
      resourceVersion: raw.metadata?.resourceVersion,
      creationTimestamp: raw.metadata?.creationTimestamp,
    },
    spec: raw.spec || { type: 'redis' },
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
      if (cleaned !== null && cleaned !== undefined && cleaned !== '') result[k] = cleaned
    }
    return Object.keys(result).length > 0 ? result : undefined
  }
  return obj
}

export function toYaml(ls: LinkSys): string {
  return yaml.dump(removeEmpty(ls), { lineWidth: -1, noRefs: true })
}

export function fromYaml(yamlStr: string): LinkSys {
  return normalize(yaml.load(yamlStr) as any)
}
