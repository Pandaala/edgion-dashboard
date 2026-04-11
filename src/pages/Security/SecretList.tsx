import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { useT } from '@/i18n'

const { Search } = Input

const DEFAULT_SECRET_YAML = `apiVersion: v1
kind: Secret
metadata:
  name: my-tls-cert
  namespace: default
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
`

const SecretList = () => {
  const t = useT()
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['secret'],
    queryFn: () => resourceApi.listAll<K8sResource>('secret'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('secret', namespace, name),
    onSuccess: () => { message.success(t('msg.deleteOk')); queryClient.invalidateQueries({ queryKey: ['secret'] }) },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (resources: Array<{ namespace: string; name: string }>) =>
      resourceApi.batchDelete('secret', resources),
    onSuccess: () => {
      message.success(t('msg.batchDeleteOk', { n: selectedRowKeys.length }))
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['secret'] })
    },
  })

  const items = data?.data || []
  const filtered = items.filter((r) => {
    const s = searchText.toLowerCase()
    return r.metadata.name.toLowerCase().includes(s) || r.metadata.namespace?.toLowerCase().includes(s)
  })

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode); setSelectedResource(resource || null); setEditorVisible(true)
  }

  const handleDelete = (namespace: string, name: string) => {
    Modal.confirm({
      title: t('confirm.deleteTitle'), content: t('confirm.deleteMsg', { name: `Secret ${name}` }),
      okText: t('confirm.okText'), okType: 'danger', cancelText: t('btn.cancel'),
      onOk: () => deleteMutation.mutate({ namespace, name }),
    })
  }

  const handleBatchDelete = () => {
    const selected = filtered
      .filter((r) => selectedRowKeys.includes(`${r.metadata.namespace}/${r.metadata.name}`))
      .map((r) => ({ namespace: r.metadata.namespace!, name: r.metadata.name }))
    Modal.confirm({
      title: t('confirm.batchDeleteTitle'), content: `${t('confirm.batchDeleteMsg', { n: selected.length })} ${t('confirm.deleteIrreversible')}`,
      okText: t('confirm.okText'), okType: 'danger', cancelText: t('btn.cancel'),
      onOk: () => batchDeleteMutation.mutate(selected),
    })
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      const ns = selectedResource?.metadata.namespace || 'default'
      if (editorMode === 'create') {
        await resourceApi.create('secret', ns, yamlContent)
        message.success(t('msg.createOk'))
      } else {
        await resourceApi.update('secret', ns, selectedResource!.metadata.name, yamlContent)
        message.success(t('msg.updateOk'))
      }
      queryClient.invalidateQueries({ queryKey: ['secret'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(t('msg.opFailed', { err: e.message })) }
    finally { setSubmitLoading(false) }
  }

  const getDataKeys = (r: K8sResource) => {
    const d = (r as any)['data'] || {}
    return Object.keys(d).join(', ')
  }

  const columns = [
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: t('col.namespace'), dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    { title: t('col.type'), key: 'type',
      render: (_: any, r: K8sResource) => {
        const secretType = (r as any)['type'] || 'Opaque'
        const color = secretType === 'kubernetes.io/tls' ? 'green' : secretType === 'Opaque' ? 'blue' : 'default'
        return <Tag color={color}>{secretType}</Tag>
      },
    },
    { title: t('col.keys'), key: 'keys',
      render: (_: any, r: K8sResource) => <span style={{ color: '#888', fontSize: 12 }}>{getDataKeys(r)}</span> },
    {
      title: t('col.actions'), key: 'actions', width: 160,
      render: (_: any, record: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', record)}>{t('btn.view')}</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', record)}>{t('btn.edit')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.metadata.namespace!, record.metadata.name)}>{t('btn.delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>{`${t('btn.create')} Secret`}</Button>
          <Button danger disabled={!selectedRowKeys.length} icon={<DeleteOutlined />} onClick={handleBatchDelete}>
            {`${t('btn.batchDelete')}${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
          </Button>
        </Space>
        <Space>
          <Search placeholder={t('ph.searchNameNs')} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`}
        columns={columns} dataSource={filtered} loading={isLoading}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{ pageSize: 20, showTotal: (total) => t('table.totalItems', { n: total }) }} size="middle"
      />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        title="Secret" defaultYaml={DEFAULT_SECRET_YAML} onClose={() => setEditorVisible(false)}
        onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  )
}

export default SecretList
