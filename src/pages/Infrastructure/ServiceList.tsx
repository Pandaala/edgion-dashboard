import { useState } from 'react'
import { Table, Button, Space, Input, Tag } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { useT } from '@/i18n'

const { Search } = Input

const ServiceList = () => {
  const t = useT()
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
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: t('col.namespace'), dataIndex: ['metadata', 'namespace'], key: 'namespace' },
    { title: t('col.type'), key: 'type',
      render: (_: any, r: K8sResource) => <Tag color="blue">{r.spec?.type || 'ClusterIP'}</Tag> },
    {
      title: t('col.ports'), key: 'ports',
      render: (_: any, r: K8sResource) => (
        <Space wrap>
          {(r.spec?.ports || []).slice(0, 3).map((p: any) => (
            <Tag key={p.port}>{p.name ? `${p.name}:` : ''}{p.port}/{p.protocol || 'TCP'}</Tag>
          ))}
        </Space>
      ),
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
        <span style={{ color: '#888', fontSize: 13 }}>{t('notice.serviceReadonly')}</span>
        <Space>
          <Search placeholder={t('ph.searchNameNs')} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
        </Space>
      </div>
      <Table rowKey={(r) => `${r.metadata.namespace}/${r.metadata.name}`} columns={columns}
        dataSource={filtered} loading={isLoading} pagination={{ pageSize: 20, showTotal: (total) => t('table.totalItems', { n: total }) }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode="view" resource={selectedResource} title="Service"
        onClose={() => setEditorVisible(false)} onSubmit={async () => {}} />
    </div>
  )
}

export default ServiceList
