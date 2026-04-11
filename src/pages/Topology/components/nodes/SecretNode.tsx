import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { LockOutlined } from '@ant-design/icons'
import { NODE_TYPE_CONFIG, baseStyle, handleStyle } from './nodeStyles'

export interface SecretNodeData {
  name: string
  namespace: string
  kind: 'secret'
  resource: unknown
}

const SecretNode = memo(({ data }: NodeProps<SecretNodeData>) => {
  const config = NODE_TYPE_CONFIG['secret']

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
        <LockOutlined style={{ color: config.color, fontSize: 13 }} />
        <span style={{ color: config.color, fontSize: 12, fontWeight: 600 }}>Secret</span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
        {data.name}
      </div>

      {/* Namespace */}
      <div style={{ fontSize: 11, color: '#888' }}>
        {data.namespace}
      </div>
    </div>
  )
})

SecretNode.displayName = 'SecretNode'

export default SecretNode
