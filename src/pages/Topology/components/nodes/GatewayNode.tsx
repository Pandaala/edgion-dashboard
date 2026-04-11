import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Tag } from 'antd'
import { CloudServerOutlined } from '@ant-design/icons'
import { NODE_TYPE_CONFIG, baseStyle, handleStyle } from './nodeStyles'

export interface GatewayNodeData {
  name: string
  namespace: string
  kind: 'gateway'
  listenersCount: number
  gatewayClassName: string
  resource: unknown
}

const GatewayNode = memo(({ data }: NodeProps<GatewayNodeData>) => {
  const config = NODE_TYPE_CONFIG['gateway']

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
        <CloudServerOutlined style={{ color: config.color, fontSize: 13 }} />
        <span style={{ color: config.color, fontSize: 12, fontWeight: 600 }}>Gateway</span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
        {data.name}
      </div>

      {/* Namespace */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        {data.namespace}
      </div>

      {/* Listeners count */}
      <div style={{ marginTop: 4 }}>
        <Tag style={{ fontSize: 10, margin: 0 }} color="blue">
          {data.listenersCount} listeners
        </Tag>
      </div>

      {/* Source handle — bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle(config)}
      />
    </div>
  )
})

GatewayNode.displayName = 'GatewayNode'

export default GatewayNode
