/**
 * EdgionStreamPlugins 表单
 */

import React from 'react'
import { Form, Input, Select, Button, Card, Space } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import MetadataSection from '../common/MetadataSection'
import type { EdgionStreamPlugins, StreamPlugin } from '@/types/edgion-stream-plugins'

interface EdgionStreamPluginsFormProps {
  data: EdgionStreamPlugins
  onChange: (data: EdgionStreamPlugins) => void
  readOnly?: boolean
  isCreate?: boolean
}

const defaultPlugin = (): StreamPlugin => ({
  type: 'IpRestriction',
  config: { ipSource: 'remoteAddr', allow: [], deny: [], defaultAction: 'allow', message: '' },
})

const EdgionStreamPluginsForm: React.FC<EdgionStreamPluginsFormProps> = ({
  data, onChange, readOnly = false, isCreate = true,
}) => {
  const plugins = data.spec?.plugins || []

  const updatePlugin = (index: number, plugin: StreamPlugin) => {
    const next = [...plugins]
    next[index] = plugin
    onChange({ ...data, spec: { ...data.spec, plugins: next } })
  }

  const addPlugin = () =>
    onChange({ ...data, spec: { ...data.spec, plugins: [...plugins, defaultPlugin()] } })

  const removePlugin = (index: number) =>
    onChange({ ...data, spec: { ...data.spec, plugins: plugins.filter((_, i) => i !== index) } })

  const updateConfig = (index: number, field: string, value: any) => {
    const plugin = plugins[index]
    updatePlugin(index, { ...plugin, config: { ...(plugin.config || {}), [field]: value } })
  }

  return (
    <Form layout="vertical" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <MetadataSection
          value={data.metadata}
          onChange={(metadata) => onChange({ ...data, metadata })}
          disabled={readOnly}
          isCreate={isCreate}
        />

        {plugins.map((plugin, index) => (
          <Card
            key={index}
            title={`插件 ${index + 1}: ${plugin.type}`}
            size="small"
            extra={!readOnly && plugins.length > 1 && (
              <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => removePlugin(index)}>删除</Button>
            )}
          >
            <Form.Item label="插件类型" style={{ marginBottom: 8 }}>
              <Select
                value={plugin.type}
                onChange={(v) => updatePlugin(index, { ...plugin, type: v })}
                disabled={readOnly}
                style={{ width: 200 }}
              >
                <Select.Option value="IpRestriction">IpRestriction（IP 访问控制）</Select.Option>
              </Select>
            </Form.Item>

            {plugin.type === 'IpRestriction' && (
              <>
                <Form.Item label="IP 来源" style={{ marginBottom: 8 }}>
                  <Select
                    value={(plugin.config as any)?.ipSource || 'remoteAddr'}
                    onChange={(v) => updateConfig(index, 'ipSource', v)}
                    disabled={readOnly}
                    style={{ width: 200 }}
                  >
                    <Select.Option value="remoteAddr">remoteAddr（连接 IP）</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="IP 白名单（CIDR，回车添加）" style={{ marginBottom: 8 }}>
                  <Select
                    mode="tags"
                    value={(plugin.config as any)?.allow || []}
                    onChange={(v) => updateConfig(index, 'allow', v)}
                    disabled={readOnly}
                    placeholder="10.0.0.0/8"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="IP 黑名单（优先于白名单）" style={{ marginBottom: 8 }}>
                  <Select
                    mode="tags"
                    value={(plugin.config as any)?.deny || []}
                    onChange={(v) => updateConfig(index, 'deny', v)}
                    disabled={readOnly}
                    placeholder="10.0.0.100/32"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="默认动作" style={{ marginBottom: 8 }}>
                  <Select
                    value={(plugin.config as any)?.defaultAction || 'allow'}
                    onChange={(v) => updateConfig(index, 'defaultAction', v)}
                    disabled={readOnly}
                    style={{ width: 160 }}
                  >
                    <Select.Option value="allow">allow（默认放行）</Select.Option>
                    <Select.Option value="deny">deny（默认拒绝）</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="拒绝消息（可选）" style={{ marginBottom: 0 }}>
                  <Input
                    value={(plugin.config as any)?.message || ''}
                    onChange={(e) => updateConfig(index, 'message', e.target.value)}
                    placeholder="Access denied"
                    disabled={readOnly}
                  />
                </Form.Item>
              </>
            )}
          </Card>
        ))}

        {!readOnly && (
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addPlugin}>
            添加插件
          </Button>
        )}
      </Space>
    </Form>
  )
}

export default EdgionStreamPluginsForm
