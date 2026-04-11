import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Badge } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { useT } from '@/i18n'

const { Search } = Input

const EndpointSliceList = () => {
  const t = useT()
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
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: t('col.namespace'), dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    {
      title: t('col.assocService'), key: 'service',
      render: (_: any, r: K8sResource) => {
        const svc = r.metadata.labels?.['kubernetes.io/service-name']
        return svc ? <Tag color="blue">{svc}</Tag> : '-'
      },
    },
    {
      title: t('col.endpoints'), key: 'endpoints',
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
      title: t('col.actions'), key: 'actions', width: 80,
      render: (_: any, r: K8sResource) => (
        <Button size="small" icon={<EyeOutlined />}
          onClick={() => { setSelectedResource(r); setEditorVisible(true) }}>{t('btn.view')}</Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#888', fontSize: 13 }}>{t('notice.endpointSliceReadonly')}</span>
        <Space>
          <Search placeholder={t('ph.searchNameNsService')} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`} columns={columns}
        dataSource={filtered} loading={isLoading} pagination={{ pageSize: 20, showTotal: (total) => t('table.totalItems', { n: total }) }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode="view" resource={selectedResource} title="EndpointSlice"
        onClose={() => setEditorVisible(false)} onSubmit={async () => {}} />
    </div>
  )
}

export default EndpointSliceList
