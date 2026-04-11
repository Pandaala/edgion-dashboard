import { useEffect } from 'react'
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'

import GatewayClassNode from './nodes/GatewayClassNode'
import GatewayNode from './nodes/GatewayNode'
import RouteNode from './nodes/RouteNode'
import ServiceNode from './nodes/ServiceNode'
import PluginNode from './nodes/PluginNode'
import TlsNode from './nodes/TlsNode'
import SecretNode from './nodes/SecretNode'
import { NODE_TYPE_CONFIG } from './nodes/nodeStyles'

// CRITICAL: defined outside component to prevent re-renders
const nodeTypes = {
  gatewayclass: GatewayClassNode,
  gateway: GatewayNode,
  route: RouteNode,
  service: ServiceNode,
  plugin: PluginNode,
  tls: TlsNode,
  secret: SecretNode,
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
}

interface Props {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (event: React.MouseEvent, node: Node) => void
}

export default function TopologyCanvas({ nodes: propNodes, edges: propEdges, onNodeClick }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges)

  useEffect(() => {
    setNodes(propNodes)
  }, [propNodes, setNodes])

  useEffect(() => {
    setEdges(propEdges)
  }, [propEdges, setEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Controls position="bottom-left" />
      <MiniMap
        position="bottom-right"
        nodeColor={(node) => NODE_TYPE_CONFIG[node.type ?? '']?.color ?? '#8c8c8c'}
      />
      <Background variant={BackgroundVariant.Dots} />
    </ReactFlow>
  )
}
