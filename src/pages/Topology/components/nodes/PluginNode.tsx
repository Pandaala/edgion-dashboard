import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Tag } from 'antd'
import { AppstoreOutlined } from '@ant-design/icons'
import { NODE_TYPE_CONFIG, baseStyle, handleStyle } from './nodeStyles'

export interface PluginNodeData {
  name: string
  namespace: string
  kind: 'edgionplugins'
  pluginCount: number
  resource: unknown
}

const PluginNode = memo(({ data }: NodeProps<PluginNodeData>) => {
  const config = NODE_TYPE_CONFIG['edgionplugins']

  return (
    <div style={baseStyle(config)}>
      {/* Target handle — left only (connected from route's right handle) */}
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle(config)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <AppstoreOutlined style={{ color: config.color, fontSize: 13 }} />
        <span style={{ color: config.color, fontSize: 12, fontWeight: 600 }}>EdgionPlugins</span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
        {data.name}
      </div>

      {/* Namespace */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        {data.namespace}
      </div>

      {/* Plugin count */}
      <div style={{ marginTop: 4 }}>
        <Tag style={{ fontSize: 10, margin: 0 }} color="volcano">
          {data.pluginCount} plugins
        </Tag>
      </div>
    </div>
  )
})

PluginNode.displayName = 'PluginNode'

export default PluginNode
