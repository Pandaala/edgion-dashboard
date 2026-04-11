import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Tag } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import { NODE_TYPE_CONFIG, baseStyle, handleStyle } from './nodeStyles'

export interface ServiceNodeData {
  name: string
  namespace: string
  kind: 'service'
  portsCount: number
  resource: unknown
}

const ServiceNode = memo(({ data }: NodeProps<ServiceNodeData>) => {
  const config = NODE_TYPE_CONFIG['service']

  return (
    <div style={baseStyle(config)}>
      {/* Target handle — top only (leaf node) */}
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle(config)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <DatabaseOutlined style={{ color: config.color, fontSize: 13 }} />
        <span style={{ color: config.color, fontSize: 12, fontWeight: 600 }}>Service</span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
        {data.name}
      </div>

      {/* Namespace */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        {data.namespace}
      </div>

      {/* Ports count */}
      <div style={{ marginTop: 4 }}>
        <Tag style={{ fontSize: 10, margin: 0 }} color="green">
          {data.portsCount} ports
        </Tag>
      </div>
    </div>
  )
})

ServiceNode.displayName = 'ServiceNode'

export default ServiceNode
