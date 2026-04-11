import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Tag } from 'antd'
import { ClusterOutlined } from '@ant-design/icons'
import { NODE_TYPE_CONFIG, baseStyle, handleStyle } from './nodeStyles'

export interface GatewayClassNodeData {
  name: string
  kind: 'gatewayclass'
  controller?: string
  resource: unknown
}

const GatewayClassNode = memo(({ data }: NodeProps<GatewayClassNodeData>) => {
  const config = NODE_TYPE_CONFIG['gatewayclass']

  return (
    <div style={baseStyle(config)}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <ClusterOutlined style={{ color: config.color, fontSize: 13 }} />
        <span style={{ color: config.color, fontSize: 12, fontWeight: 600 }}>GatewayClass</span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
        {data.name}
      </div>

      {/* Controller */}
      {data.controller && (
        <div style={{ marginTop: 4 }}>
          <Tag style={{ fontSize: 10, margin: 0 }} color="purple">
            {data.controller}
          </Tag>
        </div>
      )}

      {/* Source handle — bottom only (root node, no target) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle(config)}
      />
    </div>
  )
})

GatewayClassNode.displayName = 'GatewayClassNode'

export default GatewayClassNode
