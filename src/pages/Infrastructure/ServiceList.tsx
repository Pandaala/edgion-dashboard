import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { useT } from '@/i18n'

const { Search } = Input

const ServiceList = () => {
  const t = useT()
  const queryClient = useQueryClient()
  const { controllerId } = useParams<{ controllerId?: string }>()
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('view')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['service', controllerId ?? ''],
    queryFn: () => resourceApi.listAll<K8sResource>('service'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ ns, name }: { ns: string; name: string }) =>
      resourceApi.delete('service', ns, name),
    onSuccess: () => { message.success(t('msg.deleteOk')); queryClient.invalidateQueries({ queryKey: ['service', controllerId ?? ''] }) },
  })

  const items = data?.data || []
  const filtered = items.filter((r) => {
    const s = searchText.toLowerCase()
    return r.metadata.name.toLowerCase().includes(s) || r.metadata.namespace?.toLowerCase().includes(s)
  })

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode)
    setSelectedResource(resource || null)
    setEditorVisible(true)
  }

  const handleSubmit = async (yamlContent: string) => {
    if (editorMode === 'create') {
      await resourceApi.create('service', 'default', yamlContent)
      message.success(t('msg.createOk'))
    } else if (editorMode === 'edit' && selectedResource) {
      await resourceApi.update('service', selectedResource.metadata.namespace || 'default', selectedResource.metadata.name, yamlContent)
      message.success(t('msg.updateOk'))
    }
    setEditorVisible(false)
    queryClient.invalidateQueries({ queryKey: ['service', controllerId ?? ''] })
  }

  const handleDelete = (r: K8sResource) => {
    Modal.confirm({
      title: t('confirm.deleteTitle'),
      content: t('confirm.deleteMsg', { name: r.metadata.name }),
      okText: t('confirm.okText'),
      okType: 'danger',
      cancelText: t('btn.cancel'),
      onOk: () => deleteMutation.mutate({ ns: r.metadata.namespace || 'default', name: r.metadata.name }),
    })
  }

  const columns = [
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: t('col.namespace'), dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    { title: t('col.type'), key: 'type',
      render: (_: any, r: K8sResource) => <Tag color="blue">{r.spec?.type || 'ClusterIP'}</Tag> },
    {
      title: t('col.ports'), key: 'ports',
      render: (_: any, r: K8sResource) => (
        <Space wrap>
          {(r.spec?.ports || []).slice(0, 3).map((p: any) => (
            <Tag key={p.port}>{p.name ? `${p.name}:` : ''}{p.port}/{p.protocol || 'TCP'}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('col.actions'), key: 'actions', width: 200,
      render: (_: any, r: K8sResource) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>{t('btn.view')}</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>{t('btn.edit')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)}>{t('btn.delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Search placeholder={t('ph.searchNameNs')} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>{t('btn.create')}</Button>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`} columns={columns}
        dataSource={filtered} loading={isLoading} pagination={{ pageSize: 20, showTotal: (n) => t('table.totalItems', { n }) }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource} title="Service"
        onClose={() => setEditorVisible(false)} onSubmit={handleSubmit} />
    </div>
  )
}

export default ServiceList
