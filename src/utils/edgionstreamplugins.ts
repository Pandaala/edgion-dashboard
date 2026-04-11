/**
 * EdgionStreamPlugins 工具函数
 */

import * as yaml from 'js-yaml'
import type { EdgionStreamPlugins } from '@/types/edgion-stream-plugins'

export const DEFAULT_YAML = `apiVersion: edgion.io/v1
kind: EdgionStreamPlugins
metadata:
  name: my-stream-plugins
  namespace: default
spec:
  plugins:
    - type: IpRestriction
      config:
        ipSource: remoteAddr
        allow:
          - "10.0.0.0/8"
        defaultAction: allow
`

export function createEmpty(): EdgionStreamPlugins {
  return {
    apiVersion: 'edgion.io/v1',
    kind: 'EdgionStreamPlugins',
    metadata: { name: '', namespace: 'default' },
    spec: {
      plugins: [{
        type: 'IpRestriction',
        config: { ipSource: 'remoteAddr', allow: [], deny: [], defaultAction: 'allow', message: '' },
      }],
    },
  }
}

export function normalize(raw: any): EdgionStreamPlugins {
  return {
    apiVersion: raw.apiVersion || 'edgion.io/v1',
    kind: 'EdgionStreamPlugins',
    metadata: {
      name: raw.metadata?.name || '',
      namespace: raw.metadata?.namespace || 'default',
      labels: raw.metadata?.labels,
      annotations: raw.metadata?.annotations,
      resourceVersion: raw.metadata?.resourceVersion,
      creationTimestamp: raw.metadata?.creationTimestamp,
    },
    spec: { plugins: raw.spec?.plugins || [] },
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

export function toYaml(sp: EdgionStreamPlugins): string {
  return yaml.dump(removeEmpty(sp), { lineWidth: -1, noRefs: true })
}

export function fromYaml(yamlStr: string): EdgionStreamPlugins {
  return normalize(yaml.load(yamlStr) as any)
}
