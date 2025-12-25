import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'

const { Search } = Input

const HTTPRouteList = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const queryClient = useQueryClient()

  // Fetch HTTPRoutes
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['httproutes'],
    queryFn: () => resourceApi.listAll<K8sResource>('httproute'),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('httproute', namespace, name),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['httproutes'] })
    },
  })

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: (resources: Array<{ namespace: string; name: string }>) =>
      resourceApi.batchDelete('httproute', resources),
    onSuccess: () => {
      message.success(`成功删除 ${selectedRowKeys.length} 个资源`)
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['httproutes'] })
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
      title: '确认删除',
      content: `确定要删除 ${name} 吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
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
      title: '批量删除',
      content: `确定要删除 ${selectedResources.length} 个资源吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => batchDeleteMutation.mutate(selectedResources),
    })
  }

  const columns = [
    {
      title: '名称',
      dataIndex: ['metadata', 'name'],
      key: 'name',
      sorter: (a: K8sResource, b: K8sResource) => a.metadata.name.localeCompare(b.metadata.name),
    },
    {
      title: '命名空间',
      dataIndex: ['metadata', 'namespace'],
      key: 'namespace',
    },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="success">Active</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: K8sResource) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.metadata.namespace!, record.metadata.name)}
          >
            删除
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
            placeholder="搜索名称或命名空间"
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />}>
          创建
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <Button danger onClick={handleBatchDelete}>
              批量删除
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
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    </div>
  )
}

export default HTTPRouteList

