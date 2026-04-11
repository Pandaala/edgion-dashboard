import { useState } from 'react'
import { Table, Button, Space, Input, Tag } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'

const { Search } = Input

const ServiceList = () => {
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['service'],
    queryFn: () => resourceApi.listAll<K8sResource>('service'),
  })

  const items = data?.data || []
  const filtered = items.filter((r) => {
    const s = searchText.toLowerCase()
    return r.metadata.name.toLowerCase().includes(s) || r.metadata.namespace?.toLowerCase().includes(s)
  })

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: '命名空间', dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    { title: '类型', key: 'type',
      render: (_: any, r: K8sResource) => <Tag color="blue">{r.spec?.type || 'ClusterIP'}</Tag> },
    {
      title: '端口', key: 'ports',
      render: (_: any, r: K8sResource) => (
        <Space wrap>
          {(r.spec?.ports || []).slice(0, 3).map((p: any) => (
            <Tag key={p.port}>{p.name ? `${p.name}:` : ''}{p.port}/{p.protocol || 'TCP'}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作', key: 'actions', width: 80,
      render: (_: any, r: K8sResource) => (
        <Button size="small" icon={<EyeOutlined />}
          onClick={() => { setSelectedResource(r); setEditorVisible(true) }}>查看</Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#888', fontSize: 13 }}>Service 为只读资源，不支持在此创建</span>
        <Space>
          <Search placeholder="搜索名称/命名空间" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`} columns={columns}
        dataSource={filtered} loading={isLoading} pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode="view" resource={selectedResource} title="Service"
        onClose={() => setEditorVisible(false)} onSubmit={async () => {}} />
    </div>
  )
}

export default ServiceList
