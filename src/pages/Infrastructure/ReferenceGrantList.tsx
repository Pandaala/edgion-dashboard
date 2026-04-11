import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'

const { Search } = Input

const DEFAULT_YAML = `apiVersion: gateway.networking.k8s.io/v1
kind: ReferenceGrant
metadata:
  name: allow-gateway-secret
  namespace: default
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: Gateway
      namespace: gateway-system
  to:
    - group: ""
      kind: Secret
`

const ReferenceGrantList = () => {
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['referencegrant'],
    queryFn: () => resourceApi.listAll<K8sResource>('referencegrant'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('referencegrant', namespace, name),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['referencegrant'] }) },
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
      title: '确认删除', content: `确定要删除 ${name} 吗？`,
      okText: '确认删除', okType: 'danger', cancelText: '取消',
      onOk: () => deleteMutation.mutate({ namespace, name }),
    })
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      const ns = selectedResource?.metadata.namespace || 'default'
      if (editorMode === 'create') {
        await resourceApi.create('referencegrant', ns, yamlContent)
        message.success('创建成功')
      } else {
        await resourceApi.update('referencegrant', ns, selectedResource!.metadata.name, yamlContent)
        message.success('更新成功')
      }
      queryClient.invalidateQueries({ queryKey: ['referencegrant'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(`操作失败: ${e.message}`) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: '命名空间', dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    {
      title: 'From（来源）', key: 'from',
      render: (_: any, r: K8sResource) => (
        <Space wrap>
          {(r.spec?.from || []).map((f: any, i: number) => (
            <Tag key={i} color="orange">{f.kind} @ {f.namespace}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'To（目标）', key: 'to',
      render: (_: any, r: K8sResource) => (
        <Space wrap>
          {(r.spec?.to || []).map((t: any, i: number) => (
            <Tag key={i} color="green">{t.kind}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(r.metadata.namespace!, r.metadata.name)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>创建 ReferenceGrant</Button>
        <Space>
          <Search placeholder="搜索名称/命名空间" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`} columns={columns}
        dataSource={filtered} loading={isLoading} pagination={{ pageSize: 20 }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        title="ReferenceGrant" defaultYaml={DEFAULT_YAML} onClose={() => setEditorVisible(false)}
        onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  )
}

export default ReferenceGrantList
