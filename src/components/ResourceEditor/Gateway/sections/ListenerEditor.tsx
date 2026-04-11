/**
 * 单个 Listener 编辑器 — 按 protocol 条件渲染 TLS 配置
 */

import React from 'react'
import { Card, Form, Input, InputNumber, Select, Switch, Button, Space } from 'antd'
import { MinusCircleOutlined } from '@ant-design/icons'
import type { GatewayListener } from '@/types/gateway-api/gateway'

interface ListenerEditorProps {
  listener: GatewayListener
  index: number
  canRemove: boolean
  onChange: (listener: GatewayListener) => void
  onRemove: () => void
  disabled?: boolean
}

const ListenerEditor: React.FC<ListenerEditorProps> = ({
  listener, index, canRemove, onChange, onRemove, disabled = false,
}) => {
  const update = (partial: Partial<GatewayListener>) => onChange({ ...listener, ...partial })
  const needsTLS = listener.protocol === 'HTTPS' || listener.protocol === 'TLS'

  return (
    <Card
      type="inner"
      size="small"
      title={`Listener ${index + 1}: ${listener.name || '(unnamed)'}`}
      extra={
        !disabled && canRemove && (
          <Button danger size="small" icon={<MinusCircleOutlined />} onClick={onRemove}>删除</Button>
        )
      }
      style={{ marginBottom: 12 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space wrap>
          <Form.Item label="名称" required style={{ marginBottom: 0 }}>
            <Input
              value={listener.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="http"
              disabled={disabled}
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item label="协议" required style={{ marginBottom: 0 }}>
            <Select
              value={listener.protocol}
              onChange={(v) => update({ protocol: v })}
              disabled={disabled}
              style={{ width: 100 }}
            >
              <Select.Option value="HTTP">HTTP</Select.Option>
              <Select.Option value="HTTPS">HTTPS</Select.Option>
              <Select.Option value="TCP">TCP</Select.Option>
              <Select.Option value="TLS">TLS</Select.Option>
              <Select.Option value="UDP">UDP</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="端口" required style={{ marginBottom: 0 }}>
            <InputNumber
              value={listener.port}
              onChange={(v) => update({ port: v || 80 })}
              min={1} max={65535}
              disabled={disabled}
              style={{ width: 100 }}
            />
          </Form.Item>
          <Form.Item label="Hostname（可选）" style={{ marginBottom: 0 }}>
            <Input
              value={listener.hostname || ''}
              onChange={(e) => update({ hostname: e.target.value || undefined })}
              placeholder="*.example.com"
              disabled={disabled}
              style={{ width: 200 }}
            />
          </Form.Item>
        </Space>

        {needsTLS && (
          <Card title="TLS 配置" size="small" type="inner">
            <Form.Item label="TLS 模式" style={{ marginBottom: 8 }}>
              <Select
                value={listener.tls?.mode || 'Terminate'}
                onChange={(v) => update({ tls: { ...listener.tls, mode: v } })}
                disabled={disabled}
                style={{ width: 160 }}
              >
                <Select.Option value="Terminate">Terminate（终止）</Select.Option>
                <Select.Option value="Passthrough">Passthrough（透传）</Select.Option>
              </Select>
            </Form.Item>

            {listener.tls?.mode !== 'Passthrough' && (
              <>
                <Form.Item label="证书 Secret 名称" style={{ marginBottom: 8 }}>
                  <Input
                    value={listener.tls?.certificateRefs?.[0]?.name || ''}
                    onChange={(e) => update({
                      tls: {
                        ...listener.tls,
                        certificateRefs: [{
                          ...(listener.tls?.certificateRefs?.[0] || {}),
                          name: e.target.value,
                        }],
                      },
                    })}
                    placeholder="my-tls-cert"
                    disabled={disabled}
                  />
                </Form.Item>
                <Form.Item label="证书 Namespace（跨命名空间）" style={{ marginBottom: 0 }}>
                  <Input
                    value={listener.tls?.certificateRefs?.[0]?.namespace || ''}
                    onChange={(e) => update({
                      tls: {
                        ...listener.tls,
                        certificateRefs: [{
                          name: listener.tls?.certificateRefs?.[0]?.name || '',
                          namespace: e.target.value || undefined,
                        }],
                      },
                    })}
                    placeholder="default"
                    disabled={disabled}
                  />
                </Form.Item>
              </>
            )}
          </Card>
        )}
      </Space>
    </Card>
  )
}

export default ListenerEditor
