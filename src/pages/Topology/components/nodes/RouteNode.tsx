import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Tag } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { NODE_TYPE_CONFIG, baseStyle, handleStyle, type NodeTypeConfig } from './nodeStyles'

export interface RouteNodeData {
  name: string
  namespace: string
  kind: string
  routeKind: string
  hostnamesCount: number
  rulesCount: number
  resource: unknown
}

const RouteNode = memo(({ data }: NodeProps<RouteNodeData>) => {
  const config: NodeTypeConfig = NODE_TYPE_CONFIG[data.kind] ?? NODE_TYPE_CONFIG['httproute']

  return (
    <div style={baseStyle(config)}>
      {/* Target handle — top */}
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle(config)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <ApiOutlined style={{ color: config.color, fontSize: 13 }} />
        <span
          style={{
            color: config.color,
            fontSize: 12,
            fontWeight: 600,
            background: config.bgColor,
            border: `1px solid ${config.color}`,
            borderRadius: 4,
            padding: '0 5px',
            lineHeight: '18px',
          }}
        >
          {data.routeKind}
        </span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
        {data.name}
      </div>

      {/* Namespace */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        {data.namespace}
      </div>

      {/* Counts */}
      <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Tag style={{ fontSize: 10, margin: 0 }}>
          {data.hostnamesCount} hostnames
        </Tag>
        <Tag style={{ fontSize: 10, margin: 0 }}>
          {data.rulesCount} rules
        </Tag>
      </div>

      {/* Source handle — bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle(config)}
      />

      {/* Source handle — right (for plugin connection) */}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        style={handleStyle(config)}
      />
    </div>
  )
})

RouteNode.displayName = 'RouteNode'

export default RouteNode
