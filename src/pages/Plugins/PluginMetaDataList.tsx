import { useState } from 'react'
import { Table, Button, Space, Input, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clusterResourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'

const { Search } = Input

const DEFAULT_YAML = `apiVersion: edgion.io/v1
kind: PluginMetaData
metadata:
  name: my-plugin
spec:
  description: "My plugin description"
  schema:
    type: object
    properties: {}
  defaultConfig: {}
`

const PluginMetaDataList = () => {
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pluginmetadata'],
    queryFn: () => clusterResourceApi.listAll<K8sResource>('pluginmetadata'),
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => clusterResourceApi.delete('pluginmetadata', name),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['pluginmetadata'] }) },
  })

  const items = data?.data || []
  const filtered = items.filter((r) => r.metadata.name.toLowerCase().includes(searchText.toLowerCase()))

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode); setSelectedResource(resource || null); setEditorVisible(true)
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      if (editorMode === 'create') {
        await clusterResourceApi.create('pluginmetadata', yamlContent)
        message.success('创建成功')
      } else {
        await clusterResourceApi.update('pluginmetadata', selectedResource!.metadata.name, yamlContent)
        message.success('更新成功')
      }
      queryClient.invalidateQueries({ queryKey: ['pluginmetadata'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(`操作失败: ${e.message}`) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: '描述', key: 'desc', render: (_: any, r: K8sResource) => r.spec?.description || '-' },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: '确认删除', content: `确定要删除 ${r.metadata.name} 吗？`,
              okType: 'danger', onOk: () => deleteMutation.mutate(r.metadata.name),
            })}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>创建 PluginMetaData</Button>
        <Space>
          <Search placeholder="搜索名称" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
        </Space>
      </div>
      <Table rowKey={(r) => r.metadata.name} columns={columns} dataSource={filtered}
        loading={isLoading} pagination={{ pageSize: 20 }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        title="PluginMetaData" defaultYaml={DEFAULT_YAML} onClose={() => setEditorVisible(false)}
        onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  )
}

export default PluginMetaDataList
