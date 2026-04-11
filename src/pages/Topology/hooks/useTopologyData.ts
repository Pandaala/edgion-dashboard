import { useMemo, useCallback } from 'react'
import { useQueries } from '@tanstack/react-query'
import type { Node, Edge } from 'reactflow'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/types/gateway-api/common'
import { applyDagreLayout } from '../components/layout/dagreLayout'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopologyData {
  nodes: Node[]
  edges: Edge[]
  namespaces: string[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

interface BuildResult {
  nodes: Node[]
  edges: Edge[]
  namespaces: string[]
}

// ---------------------------------------------------------------------------
// Edge helpers
// ---------------------------------------------------------------------------

const DEFAULT_EDGE_STYLE: React.CSSProperties = {
  stroke: '#b1b1b7',
  strokeWidth: 1.5,
}

function makeEdge(
  source: string,
  target: string,
  label?: string,
  dashed?: boolean,
  sourceHandle?: string
): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: false,
    label,
    sourceHandle,
    style: dashed
      ? { ...DEFAULT_EDGE_STYLE, strokeDasharray: '5 5' }
      : DEFAULT_EDGE_STYLE,
  }
}

// ---------------------------------------------------------------------------
// Pure graph builder
// ---------------------------------------------------------------------------

export function buildTopologyGraph(
  gateways: K8sResource[],
  httproutes: K8sResource[],
  grpcroutes: K8sResource[],
  tcproutes: K8sResource[],
  udproutes: K8sResource[],
  tlsroutes: K8sResource[],
  services: K8sResource[],
  edgionplugins: K8sResource[],
  edgiontls: K8sResource[],
  secrets: K8sResource[],
  namespaceFilter: string | null
): BuildResult {
  const nodes: Node[] = []
  const edgeSet = new Set<string>()
  const edges: Edge[] = []

  // -------------------------------------------------------------------------
  // Helper to push an edge without duplicates
  // -------------------------------------------------------------------------
  function addEdge(edge: Edge) {
    if (!edgeSet.has(edge.id)) {
      edgeSet.add(edge.id)
      edges.push(edge)
    }
  }

  // -------------------------------------------------------------------------
  // Gateway nodes
  // -------------------------------------------------------------------------
  for (const res of gateways) {
    const { name, namespace } = res.metadata
    const id = `gateway/${namespace}/${name}`
    nodes.push({
      id,
      type: 'gateway',
      position: { x: 0, y: 0 },
      data: {
        name,
        namespace,
        kind: 'gateway',
        listenersCount: res.spec?.listeners?.length ?? 0,
        gatewayClassName: res.spec?.gatewayClassName,
        resource: res,
        width: 220,
        height: 80,
      },
    })
  }

  // -------------------------------------------------------------------------
  // Route nodes (5 types all use type='route')
  // -------------------------------------------------------------------------
  const routeGroups: Array<[K8sResource[], string]> = [
    [httproutes, 'HTTPRoute'],
    [grpcroutes, 'GRPCRoute'],
    [tcproutes, 'TCPRoute'],
    [udproutes, 'UDPRoute'],
    [tlsroutes, 'TLSRoute'],
  ]

  for (const [routeList, routeKind] of routeGroups) {
    for (const res of routeList) {
      const { name, namespace } = res.metadata
      const kindLower = routeKind.toLowerCase()
      const id = `${kindLower}/${namespace}/${name}`
      nodes.push({
        id,
        type: 'route',
        position: { x: 0, y: 0 },
        data: {
          name,
          namespace,
          kind: kindLower,
          routeKind,
          hostnamesCount: res.spec?.hostnames?.length ?? 0,
          rulesCount: res.spec?.rules?.length ?? 0,
          resource: res,
          width: 220,
          height: 80,
        },
      })
    }
  }

  // -------------------------------------------------------------------------
  // Service nodes
  // -------------------------------------------------------------------------
  for (const res of services) {
    const { name, namespace } = res.metadata
    const id = `service/${namespace}/${name}`
    nodes.push({
      id,
      type: 'service',
      position: { x: 0, y: 0 },
      data: {
        name,
        namespace,
        kind: 'service',
        portsCount: res.spec?.ports?.length ?? 0,
        resource: res,
        width: 220,
        height: 70,
      },
    })
  }

  // -------------------------------------------------------------------------
  // EdgionPlugins nodes (type='plugin')
  // -------------------------------------------------------------------------
  for (const res of edgionplugins) {
    const { name, namespace } = res.metadata
    const id = `edgionplugins/${namespace}/${name}`
    const pluginCount =
      (res.spec?.requestPlugins?.length ?? 0) +
      (res.spec?.upstreamResponseFilterPlugins?.length ?? 0) +
      (res.spec?.upstreamResponseBodyFilterPlugins?.length ?? 0) +
      (res.spec?.upstreamResponsePlugins?.length ?? 0)
    nodes.push({
      id,
      type: 'plugin',
      position: { x: 0, y: 0 },
      data: {
        name,
        namespace,
        kind: 'edgionplugins',
        pluginCount,
        resource: res,
        width: 220,
        height: 70,
      },
    })
  }

  // -------------------------------------------------------------------------
  // EdgionTls nodes (type='tls')
  // -------------------------------------------------------------------------
  for (const res of edgiontls) {
    const { name, namespace } = res.metadata
    const id = `edgiontls/${namespace}/${name}`
    nodes.push({
      id,
      type: 'tls',
      position: { x: 0, y: 0 },
      data: {
        name,
        namespace,
        kind: 'edgiontls',
        hostsCount: res.spec?.hosts?.length ?? 0,
        resource: res,
        width: 220,
        height: 70,
      },
    })
  }

  // -------------------------------------------------------------------------
  // Secret nodes (type='secret')
  // -------------------------------------------------------------------------
  for (const res of secrets) {
    const { name, namespace } = res.metadata
    const id = `secret/${namespace}/${name}`
    nodes.push({
      id,
      type: 'secret',
      position: { x: 0, y: 0 },
      data: {
        name,
        namespace,
        kind: 'secret',
        resource: res,
        width: 200,
        height: 60,
      },
    })
  }

  // -------------------------------------------------------------------------
  // Build node lookup set for existence checks
  // -------------------------------------------------------------------------
  const nodeIds = new Set(nodes.map((n) => n.id))

  // -------------------------------------------------------------------------
  // Edges: Gateway → Route
  // -------------------------------------------------------------------------
  for (const [routeList, routeKind] of routeGroups) {
    for (const res of routeList) {
      const { name, namespace } = res.metadata
      const kindLower = routeKind.toLowerCase()
      const routeId = `${kindLower}/${namespace}/${name}`

      const parentRefs: any[] = res.spec?.parentRefs ?? []
      for (const ref of parentRefs) {
        if ((ref.kind ?? 'Gateway') === 'Gateway') {
          const gwNs = ref.namespace ?? namespace
          const source = `gateway/${gwNs}/${ref.name}`
          if (nodeIds.has(source)) {
            addEdge(makeEdge(source, routeId, ref.sectionName))
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Edges: Route → Service  +  Route → EdgionPlugins
  // -------------------------------------------------------------------------
  for (const [routeList, routeKind] of routeGroups) {
    for (const res of routeList) {
      const { name, namespace } = res.metadata
      const kindLower = routeKind.toLowerCase()
      const routeId = `${kindLower}/${namespace}/${name}`

      // Route → Service
      const rules: any[] = res.spec?.rules ?? []
      for (const rule of rules) {
        const backendRefs: any[] = rule.backendRefs ?? []
        for (const ref of backendRefs) {
          if ((ref.kind ?? 'Service') === 'Service') {
            const svcNs = ref.namespace ?? namespace
            const target = `service/${svcNs}/${ref.name}`
            if (nodeIds.has(target)) {
              const label = ref.port ? `:${ref.port}` : undefined
              addEdge(makeEdge(routeId, target, label))
            }
          }
        }
      }

      // Route → EdgionPlugins (dashed)
      const pluginId = `edgionplugins/${namespace}/${name}`
      if (nodeIds.has(pluginId)) {
        addEdge(makeEdge(routeId, pluginId, undefined, true, 'right'))
      }
    }
  }

  // -------------------------------------------------------------------------
  // Edges: EdgionTls → Secret
  // -------------------------------------------------------------------------
  for (const res of edgiontls) {
    const { name, namespace } = res.metadata
    const secretRef = res.spec?.secretRef
    if (secretRef?.name) {
      const secretNs = secretRef.namespace ?? namespace
      const target = `secret/${secretNs}/${secretRef.name}`
      if (nodeIds.has(target)) {
        addEdge(makeEdge(`edgiontls/${namespace}/${name}`, target))
      }
    }
  }

  // -------------------------------------------------------------------------
  // Collect unique namespaces (sorted)
  // -------------------------------------------------------------------------
  const nsSet = new Set<string>()
  const allNamespacedResources = [
    ...gateways,
    ...httproutes,
    ...grpcroutes,
    ...tcproutes,
    ...udproutes,
    ...tlsroutes,
    ...services,
    ...edgionplugins,
    ...edgiontls,
    ...secrets,
  ]
  for (const res of allNamespacedResources) {
    if (res.metadata.namespace) {
      nsSet.add(res.metadata.namespace)
    }
  }
  const namespaces = Array.from(nsSet).sort()

  // -------------------------------------------------------------------------
  // Namespace filtering
  // -------------------------------------------------------------------------
  let filteredNodes: Node[]
  let filteredEdges: Edge[]

  if (namespaceFilter === null) {
    filteredNodes = nodes
    filteredEdges = edges
  } else {
    const visibleIds = new Set<string>()
    for (const node of nodes) {
      if (node.data.namespace === namespaceFilter) {
        visibleIds.add(node.id)
      }
    }

    filteredNodes = nodes.filter((n) => visibleIds.has(n.id))
    filteredEdges = edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    )
  }

  // -------------------------------------------------------------------------
  // Apply dagre layout
  // -------------------------------------------------------------------------
  const laidOutNodes = applyDagreLayout(filteredNodes, filteredEdges)

  return { nodes: laidOutNodes, edges: filteredEdges, namespaces }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const QUERY_OPTIONS = { staleTime: 30000, retry: 1 } as const

export function useTopologyData(namespaceFilter: string | null): TopologyData {
  const results = useQueries({
    queries: [
      {
        queryKey: ['topology', 'gateway'],
        queryFn: () => resourceApi.listAll<K8sResource>('gateway').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'httproute'],
        queryFn: () => resourceApi.listAll<K8sResource>('httproute').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'grpcroute'],
        queryFn: () => resourceApi.listAll<K8sResource>('grpcroute').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'tcproute'],
        queryFn: () => resourceApi.listAll<K8sResource>('tcproute').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'udproute'],
        queryFn: () => resourceApi.listAll<K8sResource>('udproute').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'tlsroute'],
        queryFn: () => resourceApi.listAll<K8sResource>('tlsroute').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'service'],
        queryFn: () => resourceApi.listAll<K8sResource>('service').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'edgionplugins'],
        queryFn: () => resourceApi.listAll<K8sResource>('edgionplugins').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'edgiontls'],
        queryFn: () => resourceApi.listAll<K8sResource>('edgiontls').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ['topology', 'secret'],
        queryFn: () => resourceApi.listAll<K8sResource>('secret').then((r) => r.data ?? []),
        ...QUERY_OPTIONS,
      },
    ],
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)

  const graph = useMemo(() => {
    if (isLoading) return { nodes: [], edges: [], namespaces: [] }

    const [
      gwResult,
      httpResult,
      grpcResult,
      tcpResult,
      udpResult,
      tlsResult,
      svcResult,
      pluginResult,
      edgionTlsResult,
      secretResult,
    ] = results

    return buildTopologyGraph(
      gwResult.data ?? [],
      httpResult.data ?? [],
      grpcResult.data ?? [],
      tcpResult.data ?? [],
      udpResult.data ?? [],
      tlsResult.data ?? [],
      svcResult.data ?? [],
      pluginResult.data ?? [],
      edgionTlsResult.data ?? [],
      secretResult.data ?? [],
      namespaceFilter
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...results.map((r) => r.data),
    namespaceFilter,
    isLoading,
  ])

  const refetch = useCallback(() => {
    results.forEach((r) => r.refetch())
  }, [results])

  return {
    nodes: graph.nodes,
    edges: graph.edges,
    namespaces: graph.namespaces,
    isLoading,
    isError,
    refetch,
  }
}
