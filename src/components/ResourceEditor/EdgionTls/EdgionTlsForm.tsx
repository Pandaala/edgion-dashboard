/**
 * EdgionTls 表单
 */

import React from 'react'
import { Form, Input, Card, Select, Space } from 'antd'
import MetadataSection from '../common/MetadataSection'
import HostnamesSection from '../common/HostnamesSection'
import ClientAuthSection from './sections/ClientAuthSection'
import type { EdgionTls } from '@/types/edgion-tls'

interface EdgionTlsFormProps {
  data: EdgionTls
  onChange: (data: EdgionTls) => void
  readOnly?: boolean
  isCreate?: boolean
}

const TLS_VERSIONS = ['TLS1_0', 'TLS1_1', 'TLS1_2', 'TLS1_3']

const EdgionTlsForm: React.FC<EdgionTlsFormProps> = ({ data, onChange, readOnly = false, isCreate = true }) => {
  const updateSpec = (partial: Partial<typeof data.spec>) =>
    onChange({ ...data, spec: { ...data.spec, ...partial } })

  return (
    <Form layout="vertical" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <MetadataSection
          value={data.metadata}
          onChange={(metadata) => onChange({ ...data, metadata })}
          disabled={readOnly}
          isCreate={isCreate}
        />

        <Card title="域名（Hosts）" size="small">
          <HostnamesSection
            value={data.spec?.hosts || []}
            onChange={(hosts) => updateSpec({ hosts })}
            disabled={readOnly}
          />
        </Card>

        <Card title="服务端证书" size="small">
          <Form.Item label="证书 Secret 名称" required style={{ marginBottom: 8 }}>
            <Input
              value={data.spec?.secretRef?.name || ''}
              onChange={(e) => updateSpec({ secretRef: { ...data.spec.secretRef, name: e.target.value } })}
              placeholder="my-tls-cert"
              disabled={readOnly}
            />
          </Form.Item>
          <Form.Item label="证书 Secret Namespace（可选）" style={{ marginBottom: 0 }}>
            <Input
              value={data.spec?.secretRef?.namespace || ''}
              onChange={(e) => updateSpec({
                secretRef: { ...data.spec.secretRef, namespace: e.target.value || undefined }
              })}
              placeholder="default"
              disabled={readOnly}
              style={{ width: 200 }}
            />
          </Form.Item>
        </Card>

        <ClientAuthSection
          value={data.spec?.clientAuth}
          onChange={(clientAuth) => updateSpec({ clientAuth })}
          disabled={readOnly}
        />

        <Card title="TLS 版本 & 密码套件（可选）" size="small">
          <Form.Item label="最低 TLS 版本" style={{ marginBottom: 8 }}>
            <Select
              value={data.spec?.minTlsVersion}
              onChange={(v) => updateSpec({ minTlsVersion: v })}
              disabled={readOnly}
              style={{ width: 160 }}
              allowClear
              placeholder="默认"
            >
              {TLS_VERSIONS.map((v) => <Select.Option key={v} value={v}>{v}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="自定义密码套件（可选）" style={{ marginBottom: 0 }}>
            <Select
              mode="tags"
              value={data.spec?.cipherSuites || []}
              onChange={(v) => updateSpec({ cipherSuites: v })}
              disabled={readOnly}
              placeholder="输入密码套件后回车"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
      </Space>
    </Form>
  )
}

export default EdgionTlsForm
