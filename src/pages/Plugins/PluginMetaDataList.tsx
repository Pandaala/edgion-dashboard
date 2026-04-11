import { useState } from 'react'
import { Table, Button, Space, Input, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { useT } from '@/i18n'

const { Search } = Input

const DEFAULT_YAML = `apiVersion: edgion.io/v1
kind: PluginMetaData
metadata:
  name: my-plugin
  namespace: default
spec:
  description: "My plugin description"
  schema:
    type: object
    properties: {}
  defaultConfig: {}
`

const PluginMetaDataList = () => {
  const t = useT()
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pluginmetadata'],
    queryFn: () => resourceApi.listAll<K8sResource>('pluginmetadata'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('pluginmetadata', namespace, name),
    onSuccess: () => { message.success(t('msg.deleteOk')); queryClient.invalidateQueries({ queryKey: ['pluginmetadata'] }) },
  })

  const items = data?.data || []
  const filtered = items.filter((r) => {
    const s = searchText.toLowerCase()
    return r.metadata.name.toLowerCase().includes(s) || r.metadata.namespace?.toLowerCase().includes(s)
  })

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode); setSelectedResource(resource || null); setEditorVisible(true)
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      const ns = selectedResource?.metadata.namespace || 'default'
      if (editorMode === 'create') {
        await resourceApi.create('pluginmetadata', ns, yamlContent)
        message.success(t('msg.createOk'))
      } else {
        await resourceApi.update('pluginmetadata', ns, selectedResource!.metadata.name, yamlContent)
        message.success(t('msg.updateOk'))
      }
      queryClient.invalidateQueries({ queryKey: ['pluginmetadata'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(t('msg.opFailed', { err: e.message })) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: t('col.namespace'), dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    { title: t('col.description'), key: 'desc', render: (_: any, r: K8sResource) => r.spec?.description || '-' },
    {
      title: t('col.actions'), key: 'actions', width: 160,
      render: (_: any, record: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', record)}>{t('btn.view')}</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', record)}>{t('btn.edit')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: t('confirm.deleteTitle'), content: t('confirm.deleteMsg', { name: record.metadata.name }),
              okText: t('confirm.okText'), okType: 'danger', cancelText: t('btn.cancel'),
              onOk: () => deleteMutation.mutate({
                namespace: record.metadata.namespace!, name: record.metadata.name,
              }),
            })}>{t('btn.delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>{`${t('btn.create')} PluginMetaData`}</Button>
        <Space>
          <Search placeholder={t('ph.searchNameNs')} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`}
        columns={columns} dataSource={filtered} loading={isLoading}
        pagination={{ pageSize: 20, showTotal: (total) => t('table.totalItems', { n: total }) }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        title="PluginMetaData" defaultYaml={DEFAULT_YAML} onClose={() => setEditorVisible(false)}
        onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  )
}

export default PluginMetaDataList
