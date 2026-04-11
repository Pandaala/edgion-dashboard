import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import BackendTLSPolicyEditor from '@/components/ResourceEditor/BackendTLSPolicy/BackendTLSPolicyEditor'
import { useT } from '@/i18n'

const { Search } = Input

const BackendTLSPolicyList = () => {
  const t = useT()
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['backendtlspolicy'],
    queryFn: () => resourceApi.listAll<K8sResource>('backendtlspolicy'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('backendtlspolicy', namespace, name),
    onSuccess: () => { message.success(t('msg.deleteOk')); queryClient.invalidateQueries({ queryKey: ['backendtlspolicy'] }) },
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
      title: t('confirm.deleteTitle'), content: t('confirm.deleteMsg', { name }),
      okText: t('confirm.okText'), okType: 'danger', cancelText: t('btn.cancel'),
      onOk: () => deleteMutation.mutate({ namespace, name }),
    })
  }

  const columns = [
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: t('col.namespace'), dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    {
      title: t('col.targetService'), key: 'target',
      render: (_: any, r: K8sResource) => (
        <Space wrap>
          {(r.spec?.targetRefs || []).map((ref: any, i: number) => (
            <Tag key={i} color="blue">{ref.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('col.hostname'), key: 'hostname',
      render: (_: any, r: K8sResource) => r.spec?.validation?.hostname || '-',
    },
    {
      title: t('col.actions'), key: 'actions', width: 160,
      render: (_: any, r: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>{t('btn.view')}</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>{t('btn.edit')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(r.metadata.namespace!, r.metadata.name)}>{t('btn.delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>{`${t('btn.create')} BackendTLSPolicy`}</Button>
        <Space>
          <Search placeholder={t('ph.searchNameNs')} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`}
        columns={columns} dataSource={filtered} loading={isLoading}
        pagination={{ pageSize: 20 }} size="middle"
      />
      <BackendTLSPolicyEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        onClose={() => setEditorVisible(false)} />
    </div>
  )
}

export default BackendTLSPolicyList
