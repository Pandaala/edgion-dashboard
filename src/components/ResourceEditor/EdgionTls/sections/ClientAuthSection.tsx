/**
 * EdgionTls mTLS 客户端认证配置
 */

import React from 'react'
import { Card, Form, Input, InputNumber, Select } from 'antd'
import type { ClientAuth } from '@/types/edgion-tls'

interface ClientAuthSectionProps {
  value?: ClientAuth
  onChange?: (value: ClientAuth | undefined) => void
  disabled?: boolean
}

const ClientAuthSection: React.FC<ClientAuthSectionProps> = ({ value, onChange, disabled = false }) => {
  const update = (partial: Partial<ClientAuth>) => onChange?.({ ...value, ...partial })

  const mode = value?.mode || 'Terminate'
  const needsCA = mode === 'Mutual' || mode === 'OptionalMutual'

  return (
    <Card title="mTLS 客户端认证（可选）" size="small">
      <Form.Item label="认证模式" style={{ marginBottom: 8 }}>
        <Select
          value={mode}
          onChange={(v) => update({ mode: v as any })}
          disabled={disabled}
          style={{ width: 200 }}
        >
          <Select.Option value="Terminate">Terminate（不验证客户端）</Select.Option>
          <Select.Option value="Mutual">Mutual（强制客户端证书）</Select.Option>
          <Select.Option value="OptionalMutual">OptionalMutual（可选客户端证书）</Select.Option>
        </Select>
      </Form.Item>

      {needsCA && (
        <>
          <Form.Item label="CA Secret 名称" required style={{ marginBottom: 8 }}>
            <Input
              value={value?.caSecretRef?.name || ''}
              onChange={(e) => update({ caSecretRef: { name: e.target.value, namespace: value?.caSecretRef?.namespace } })}
              placeholder="client-ca"
              disabled={disabled}
            />
          </Form.Item>
          <Form.Item label="CA Secret Namespace" style={{ marginBottom: 8 }}>
            <Input
              value={value?.caSecretRef?.namespace || ''}
              onChange={(e) => update({ caSecretRef: { name: value?.caSecretRef?.name || '', namespace: e.target.value || undefined } })}
              placeholder="default"
              disabled={disabled}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label="证书链验证深度（1-9）" style={{ marginBottom: 8 }}>
            <InputNumber
              value={value?.verifyDepth ?? 1}
              onChange={(v) => update({ verifyDepth: v || 1 })}
              min={1} max={9}
              disabled={disabled}
              style={{ width: 120 }}
            />
          </Form.Item>
        </>
      )}
    </Card>
  )
}

export default ClientAuthSection
