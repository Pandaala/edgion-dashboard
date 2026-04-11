import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Badge } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'

const { Search } = Input

const EndpointSliceList = () => {
  const [searchText, setSearchText] = useState('')
  const [editorVisible, setEditorVisible] = useState(false)
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['endpointslice'],
    queryFn: () => resourceApi.listAll<K8sResource>('endpointslice'),
  })

  const items = data?.data || []
  const filtered = items.filter((r) => {
    const s = searchText.toLowerCase()
    const svcName = r.metadata.labels?.['kubernetes.io/service-name'] || ''
    return r.metadata.name.toLowerCase().includes(s) || r.metadata.namespace?.toLowerCase().includes(s) ||
      svcName.toLowerCase().includes(s)
  })

  const getReadyCount = (r: K8sResource) => {
    const endpoints: any[] = (r as any)['endpoints'] || []
    return endpoints.filter((e) => e.conditions?.ready).length
  }

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: '命名空间', dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    {
      title: '关联 Service', key: 'service',
      render: (_: any, r: K8sResource) => {
        const svc = r.metadata.labels?.['kubernetes.io/service-name']
        return svc ? <Tag color="blue">{svc}</Tag> : '-'
      },
    },
    {
      title: 'Endpoints', key: 'endpoints',
      render: (_: any, r: K8sResource) => {
        const total = ((r as any)['endpoints'] || []).length
        const ready = getReadyCount(r)
        return (
          <Space>
            <Badge color="green" text={`${ready} Ready`} />
            <span>/ {total} Total</span>
          </Space>
        )
      },
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
        <span style={{ color: '#888', fontSize: 13 }}>EndpointSlice 为只读资源</span>
        <Space>
          <Search placeholder="搜索名称/命名空间/Service" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`} columns={columns}
        dataSource={filtered} loading={isLoading} pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode="view" resource={selectedResource} title="EndpointSlice"
        onClose={() => setEditorVisible(false)} onSubmit={async () => {}} />
    </div>
  )
}

export default EndpointSliceList
