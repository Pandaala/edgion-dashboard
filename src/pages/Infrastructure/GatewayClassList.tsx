import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clusterResourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'

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
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['gatewayclass'] }) },
  })

  const items = data?.data || []
  const filtered = items.filter((r) => r.metadata.name.toLowerCase().includes(searchText.toLowerCase()))

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode); setSelectedResource(resource || null); setEditorVisible(true)
  }

  const handleDelete = (name: string) => {
    Modal.confirm({
      title: '确认删除', content: `确定要删除 ${name} 吗？`,
      okText: '确认删除', okType: 'danger', cancelText: '取消',
      onOk: () => deleteMutation.mutate(name),
    })
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      if (editorMode === 'create') {
        await clusterResourceApi.create('gatewayclass', yamlContent)
        message.success('创建成功')
      } else {
        await clusterResourceApi.update('gatewayclass', selectedResource!.metadata.name, yamlContent)
        message.success('更新成功')
      }
      queryClient.invalidateQueries({ queryKey: ['gatewayclass'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(`操作失败: ${e.message}`) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: 'Controller', key: 'controller',
      render: (_: any, r: K8sResource) => <Tag color="blue">{r.spec?.controllerName || '-'}</Tag> },
    { title: '描述', key: 'desc',
      render: (_: any, r: K8sResource) => r.spec?.description || '-' },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.metadata.name)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>创建 GatewayClass</Button>
        <Space>
          <Search placeholder="搜索名称" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
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
