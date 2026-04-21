import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import type { HTTPRoute } from '@/types/gateway-api'
import HTTPRouteEditor from '@/components/ResourceEditor/HTTPRoute/HTTPRouteEditor'
import { useT } from '@/i18n'

const { Search } = Input

const HTTPRouteList = () => {
  const t = useT()
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<HTTPRoute | null>(null)
  const queryClient = useQueryClient()
  const { controllerId } = useParams<{ controllerId?: string }>()

  // Fetch HTTPRoutes
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['httproutes', controllerId ?? ''],
    queryFn: () => resourceApi.listAll<K8sResource>('httproute'),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('httproute', namespace, name),
    onSuccess: () => {
      message.success(t('msg.deleteOk'))
      queryClient.invalidateQueries({ queryKey: ['httproutes', controllerId ?? ''] })
    },
  })

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: (resources: Array<{ namespace: string; name: string }>) =>
      resourceApi.batchDelete('httproute', resources),
    onSuccess: () => {
      message.success(t('msg.batchDeleteOk', { n: selectedRowKeys.length }))
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['httproutes', controllerId ?? ''] })
    },
  })

  const routes = data?.data || []

  // Filter routes by search text
  const filteredRoutes = routes.filter((route) => {
    const searchLower = searchText.toLowerCase()
    return (
      route.metadata.name.toLowerCase().includes(searchLower) ||
      route.metadata.namespace?.toLowerCase().includes(searchLower)
    )
  })

  const handleDelete = (namespace: string, name: string) => {
    Modal.confirm({
      title: t('confirm.deleteTitle'),
      content: t('confirm.deleteMsg', { name }),
      okText: t('confirm.okText'),
      okType: 'danger',
      cancelText: t('btn.cancel'),
      onOk: () => deleteMutation.mutate({ namespace, name }),
    })
  }

  const handleBatchDelete = () => {
    const selectedResources = filteredRoutes
      .filter((route) => selectedRowKeys.includes(`${route.metadata.namespace}/${route.metadata.name}`))
      .map((route) => ({
        namespace: route.metadata.namespace!,
        name: route.metadata.name,
      }))

    Modal.confirm({
      title: t('confirm.batchDeleteTitle'),
      content: `${t('confirm.batchDeleteMsg', { n: selectedResources.length })} ${t('confirm.deleteIrreversible')}`,
      okText: t('confirm.okText'),
      okType: 'danger',
      cancelText: t('btn.cancel'),
      onOk: () => batchDeleteMutation.mutate(selectedResources),
    })
  }

  const handleCreate = () => {
    setEditorMode('create')
    setSelectedResource(null)
    setEditorVisible(true)
  }

  const handleView = (record: K8sResource) => {
    setEditorMode('view')
    setSelectedResource(record as unknown as HTTPRoute)
    setEditorVisible(true)
  }

  const handleEdit = (record: K8sResource) => {
    setEditorMode('edit')
    setSelectedResource(record as unknown as HTTPRoute)
    setEditorVisible(true)
  }

  const handleEditorClose = () => {
    setEditorVisible(false)
    setSelectedResource(null)
  }

  const columns = [
    {
      title: t('col.name'),
      dataIndex: ['metadata', 'name'],
      key: 'name',
      sorter: (a: K8sResource, b: K8sResource) => a.metadata.name.localeCompare(b.metadata.name),
    },
    {
      title: t('col.namespace'),
      dataIndex: ['metadata', 'namespace'],
      key: 'namespace',
    },
    {
      title: t('col.status'),
      key: 'status',
      render: () => <Tag color="success">Active</Tag>,
    },
    {
      title: t('col.actions'),
      key: 'actions',
      render: (_: any, record: K8sResource) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            {t('btn.view')}
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            {t('btn.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.metadata.namespace!, record.metadata.name)}
          >
            {t('btn.delete')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Search
            placeholder={t('ph.searchNameNs')}
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            {t('btn.refresh')}
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('btn.create')}
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>{t('status.selected', { n: selectedRowKeys.length })}</span>
            <Button danger onClick={handleBatchDelete}>
              {t('btn.batchDelete')}
            </Button>
          </Space>
        </div>
      )}

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        columns={columns}
        dataSource={filteredRoutes}
        loading={isLoading}
        rowKey={(record) => `${record.metadata.namespace}/${record.metadata.name}`}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('table.totalItems', { n: total }),
        }}
      />

      <HTTPRouteEditor
        visible={editorVisible}
        mode={editorMode}
        resource={selectedResource as any}
        onClose={handleEditorClose}
      />
    </div>
  )
}

export default HTTPRouteList

