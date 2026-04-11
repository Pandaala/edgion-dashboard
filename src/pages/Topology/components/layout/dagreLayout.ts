import dagre from '@dagrejs/dagre'
import type { Node, Edge } from 'reactflow'

export interface LayoutOptions {
  direction?: 'TB' | 'LR'
  nodeWidth?: number
  nodeHeight?: number
  rankSep?: number
  nodeSep?: number
}

export function applyDagreLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): Node[] {
  const {
    direction = 'TB',
    nodeWidth = 220,
    nodeHeight = 80,
    rankSep = 80,
    nodeSep = 40,
  } = options ?? {}

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep })

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.data?.width ?? nodeWidth,
      height: node.data?.height ?? nodeHeight,
    })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    const w = node.data?.width ?? nodeWidth
    const h = node.data?.height ?? nodeHeight
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    }
  })
}
