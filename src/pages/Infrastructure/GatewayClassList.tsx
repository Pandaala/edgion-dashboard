import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clusterResourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { useT } from '@/i18n'

const { Search } = Input

const DEFAULT_YAML = `apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: edgion
spec:
  controllerName: edgion.io/gateway-controller
  description: "Edgion Gateway Controller"
`

const GatewayClassList = () => {
  const t = useT()
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gatewayclass'],
    queryFn: () => clusterResourceApi.listAll<K8sResource>('gatewayclass'),
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => clusterResourceApi.delete('gatewayclass', name),
    onSuccess: () => { message.success(t('msg.deleteOk')); queryClient.invalidateQueries({ queryKey: ['gatewayclass'] }) },
  })

  const items = data?.data || []
  const filtered = items.filter((r) => r.metadata.name.toLowerCase().includes(searchText.toLowerCase()))

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode); setSelectedResource(resource || null); setEditorVisible(true)
  }

  const handleDelete = (name: string) => {
    Modal.confirm({
      title: t('confirm.deleteTitle'), content: t('confirm.deleteMsg', { name }),
      okText: t('confirm.okText'), okType: 'danger', cancelText: t('btn.cancel'),
      onOk: () => deleteMutation.mutate(name),
    })
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      if (editorMode === 'create') {
        await clusterResourceApi.create('gatewayclass', yamlContent)
        message.success(t('msg.createOk'))
      } else {
        await clusterResourceApi.update('gatewayclass', selectedResource!.metadata.name, yamlContent)
        message.success(t('msg.updateOk'))
      }
      queryClient.invalidateQueries({ queryKey: ['gatewayclass'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(t('msg.opFailed', { err: e.message })) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: t('col.controller'), key: 'controller',
      render: (_: any, r: K8sResource) => <Tag color="blue">{r.spec?.controllerName || '-'}</Tag> },
    { title: t('col.description'), key: 'desc',
      render: (_: any, r: K8sResource) => r.spec?.description || '-' },
    {
      title: t('col.actions'), key: 'actions', width: 160,
      render: (_: any, r: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>{t('btn.view')}</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>{t('btn.edit')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.metadata.name)}>{t('btn.delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>{`${t('btn.create')} GatewayClass`}</Button>
        <Space>
          <Search placeholder={t('ph.searchName')} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
        </Space>
      </div>
      <Table rowKey={(r) => r.metadata.name} columns={columns} dataSource={filtered}
        loading={isLoading} pagination={{ pageSize: 20 }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        title="GatewayClass" defaultYaml={DEFAULT_YAML} onClose={() => setEditorVisible(false)}
        onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  )
}

export default GatewayClassList
