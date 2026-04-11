import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Tag } from 'antd'
import { SafetyOutlined } from '@ant-design/icons'
import { NODE_TYPE_CONFIG, baseStyle, handleStyle } from './nodeStyles'

export interface TlsNodeData {
  name: string
  namespace: string
  kind: 'edgiontls'
  hostsCount: number
  resource: unknown
}

const TlsNode = memo(({ data }: NodeProps<TlsNodeData>) => {
  const config = NODE_TYPE_CONFIG['edgiontls']

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
        <SafetyOutlined style={{ color: config.color, fontSize: 13 }} />
        <span style={{ color: config.color, fontSize: 12, fontWeight: 600 }}>EdgionTls</span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
        {data.name}
      </div>

      {/* Namespace */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        {data.namespace}
      </div>

      {/* Hosts count */}
      <div style={{ marginTop: 4 }}>
        <Tag style={{ fontSize: 10, margin: 0 }} color="magenta">
          {data.hostsCount} hosts
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

TlsNode.displayName = 'TlsNode'

export default TlsNode
