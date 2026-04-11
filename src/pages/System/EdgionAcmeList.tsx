import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message, Badge } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { DEFAULT_YAML } from '@/utils/edgionacme'
import { apiClient } from '@/api/client'

const { Search } = Input

const phaseColorMap: Record<string, string> = {
  Ready: 'success', Issuing: 'processing', Renewing: 'processing',
  Pending: 'warning', Failed: 'error',
}

const EdgionAcmeList = () => {
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['edgionacme'],
    queryFn: () => resourceApi.listAll<K8sResource>('edgionacme'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('edgionacme', namespace, name),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['edgionacme'] }) },
  })

  const items = data?.data || []
  const filtered = items.filter((r) => {
    const s = searchText.toLowerCase()
    return r.metadata.name.toLowerCase().includes(s) || r.metadata.namespace?.toLowerCase().includes(s)
  })

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode); setSelectedResource(resource || null); setEditorVisible(true)
  }

  const handleTrigger = async (r: K8sResource) => {
    try {
      await apiClient.post(`/services/acme/${r.metadata.namespace}/${r.metadata.name}/trigger`)
      message.success('手动触发签发成功')
      refetch()
    } catch (e: any) { message.error(`触发失败: ${e.message}`) }
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      const ns = selectedResource?.metadata.namespace || 'default'
      if (editorMode === 'create') {
        await resourceApi.create('edgionacme', ns, yamlContent)
        message.success('创建成功')
      } else {
        await resourceApi.update('edgionacme', ns, selectedResource!.metadata.name, yamlContent)
        message.success('更新成功')
      }
      queryClient.invalidateQueries({ queryKey: ['edgionacme'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(`操作失败: ${e.message}`) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: '命名空间', dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    { title: '域名', key: 'domains',
      render: (_: any, r: K8sResource) => (
        <Space wrap>
          {(r.spec?.domains || []).slice(0, 2).map((d: string) => <Tag key={d}>{d}</Tag>)}
          {(r.spec?.domains || []).length > 2 && <Tag>+{(r.spec?.domains || []).length - 2}</Tag>}
        </Space>
      ),
    },
    { title: 'Challenge', key: 'challenge',
      render: (_: any, r: K8sResource) => (
        <Tag color="purple">{r.spec?.challenge?.type || '-'}</Tag>
      ),
    },
    { title: '状态', key: 'phase',
      render: (_: any, r: K8sResource) => {
        const phase = r.status?.phase
        if (!phase) return '-'
        return <Badge status={phaseColorMap[phase] as any || 'default'} text={phase} />
      },
    },
    {
      title: '操作', key: 'actions', width: 200,
      render: (_: any, record: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', record)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', record)}>编辑</Button>
          <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handleTrigger(record)}>触发</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: '确认删除', content: `确定要删除 ${record.metadata.name} 吗？`,
              okType: 'danger', onOk: () => deleteMutation.mutate({
                namespace: record.metadata.namespace!, name: record.metadata.name,
              }),
            })}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>创建 EdgionAcme</Button>
        <Space>
          <Search placeholder="搜索名称/命名空间" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`}
        columns={columns} dataSource={filtered} loading={isLoading}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }} size="middle"
      />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        title="EdgionAcme" defaultYaml={DEFAULT_YAML} onClose={() => setEditorVisible(false)}
        onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  )
}

export default EdgionAcmeList
