import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import LinkSysEditor from '@/components/ResourceEditor/LinkSys/LinkSysEditor'

const { Search } = Input

const typeColorMap: Record<string, string> = {
  redis: 'red', elasticsearch: 'gold', etcd: 'blue', webhook: 'green',
}

const LinkSysList = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['linksys'],
    queryFn: () => resourceApi.listAll<K8sResource>('linksys'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('linksys', namespace, name),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['linksys'] }) },
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

  const getAddressSummary = (r: K8sResource) => {
    const type = r.spec?.type
    const config = r.spec?.[type] || {}
    const addrs = config.addresses || config.endpoints || []
    return addrs.slice(0, 2).join(', ')
  }

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: '命名空间', dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    { title: '类型', key: 'type',
      render: (_: any, r: K8sResource) => {
        const t = r.spec?.type || 'unknown'
        return <Tag color={typeColorMap[t] || 'default'}>{t}</Tag>
      },
    },
    { title: '地址', key: 'addr', render: (_: any, r: K8sResource) => getAddressSummary(r) || '-' },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, record: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', record)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', record)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.metadata.namespace!, record.metadata.name)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>创建 LinkSys</Button>
          <Button danger disabled={!selectedRowKeys.length} icon={<DeleteOutlined />}
            onClick={() => {}}>
            批量删除 {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>
        </Space>
        <Space>
          <Search placeholder="搜索名称/命名空间" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`}
        columns={columns} dataSource={filtered} loading={isLoading}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }} size="middle"
      />
      <LinkSysEditor visible={editorVisible} mode={editorMode} resource={selectedResource as any}
        onClose={() => setEditorVisible(false)} />
    </div>
  )
}

export default LinkSysList
