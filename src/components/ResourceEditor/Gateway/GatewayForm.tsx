/**
 * Gateway 表单
 */

import React from 'react'
import { Form, Input, Card, Space } from 'antd'
import MetadataSection from '../common/MetadataSection'
import ListenersSection from './sections/ListenersSection'
import type { Gateway } from '@/types/gateway-api/gateway'

interface GatewayFormProps {
  data: Gateway
  onChange: (data: Gateway) => void
  readOnly?: boolean
  isCreate?: boolean
}

const GATEWAY_ANNOTATIONS = [
  'edgion.io/http-to-https-redirect',
  'edgion.io/https-redirect-port',
  'edgion.io/enable-http2',
  'edgion.io/edgion-stream-plugins',
]

const GatewayForm: React.FC<GatewayFormProps> = ({ data, onChange, readOnly = false, isCreate = true }) => {
  const updateSpec = (partial: Partial<typeof data.spec>) =>
    onChange({ ...data, spec: { ...data.spec, ...partial } })

  const annotations = data.metadata?.annotations || {}
  const updateAnnotation = (key: string, value: string) => {
    const next = { ...annotations }
    if (!value) delete next[key]
    else next[key] = value
    onChange({ ...data, metadata: { ...data.metadata, annotations: next } })
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

        <Card title="GatewayClass" size="small">
          <Form.Item label="GatewayClass 名称" required style={{ marginBottom: 0 }}>
            <Input
              value={data.spec?.gatewayClassName || ''}
              onChange={(e) => updateSpec({ gatewayClassName: e.target.value })}
              placeholder="edgion"
              disabled={readOnly}
              style={{ width: 240 }}
            />
          </Form.Item>
        </Card>

        <Card title="Listeners" size="small">
          <ListenersSection
            value={data.spec?.listeners || []}
            onChange={(listeners) => updateSpec({ listeners })}
            disabled={readOnly}
          />
        </Card>

        <Card title="Edgion 扩展配置（可选）" size="small">
          <Form.Item label="HTTP→HTTPS 跳转" style={{ marginBottom: 8 }}>
            <Input
              value={annotations['edgion.io/http-to-https-redirect'] || ''}
              onChange={(e) => updateAnnotation('edgion.io/http-to-https-redirect', e.target.value)}
              placeholder="true / false"
              disabled={readOnly}
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item label="HTTPS 跳转端口" style={{ marginBottom: 8 }}>
            <Input
              value={annotations['edgion.io/https-redirect-port'] || ''}
              onChange={(e) => updateAnnotation('edgion.io/https-redirect-port', e.target.value)}
              placeholder="443"
              disabled={readOnly}
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item label="启用 HTTP/2" style={{ marginBottom: 8 }}>
            <Input
              value={annotations['edgion.io/enable-http2'] || ''}
              onChange={(e) => updateAnnotation('edgion.io/enable-http2', e.target.value)}
              placeholder="true / false"
              disabled={readOnly}
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item label="Gateway 级 StreamPlugins" style={{ marginBottom: 0 }}>
            <Input
              value={annotations['edgion.io/edgion-stream-plugins'] || ''}
              onChange={(e) => updateAnnotation('edgion.io/edgion-stream-plugins', e.target.value)}
              placeholder="namespace/plugin-name"
              disabled={readOnly}
            />
          </Form.Item>
        </Card>
      </Space>
    </Form>
  )
}

export default GatewayForm
