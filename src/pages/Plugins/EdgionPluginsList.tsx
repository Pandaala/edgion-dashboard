import { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, message, Badge, Tooltip } from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import EdgionPluginsEditor from '@/components/ResourceEditor/EdgionPlugins/EdgionPluginsEditor'
import { countPluginsByStage } from '@/utils/edgionplugins'

const { Search } = Input

const EdgionPluginsList = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['edgionplugins'],
    queryFn: () => resourceApi.listAll<K8sResource>('edgionplugins'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      resourceApi.delete('edgionplugins', namespace, name),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['edgionplugins'] })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (resources: Array<{ namespace: string; name: string }>) =>
      resourceApi.batchDelete('edgionplugins', resources),
    onSuccess: () => {
      message.success(`成功删除 ${selectedRowKeys.length} 个资源`)
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['edgionplugins'] })
    },
  })

  const pluginsList = data?.data || []

  const filteredList = pluginsList.filter((p) => {
    const lower = searchText.toLowerCase()
    return (
      p.metadata.name.toLowerCase().includes(lower) ||
      p.metadata.namespace?.toLowerCase().includes(lower)
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
    const selectedResources = filteredList
      .filter((p) => selectedRowKeys.includes(`${p.metadata.namespace}/${p.metadata.name}`))
      .map((p) => ({ namespace: p.metadata.namespace!, name: p.metadata.name }))

    Modal.confirm({
      title: '批量删除',
      content: `确定要删除 ${selectedResources.length} 个资源吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
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
    setSelectedResource(record)
    setEditorVisible(true)
  }

  const handleEdit = (record: K8sResource) => {
    setEditorMode('edit')
    setSelectedResource(record)
    setEditorVisible(true)
  }

  const handleEditorClose = () => {
    setEditorVisible(false)
    setSelectedResource(null)
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
      title: '插件总数',
      key: 'pluginCount',
      render: (_: any, record: K8sResource) => {
        const stages = countPluginsByStage((record as any).spec)
        const total = stages.request + stages.responseFilter + stages.responseBodyFilter + stages.response
        const tooltipText = [
          `请求阶段: ${stages.request}`,
          `响应过滤: ${stages.responseFilter}`,
          `响应体: ${stages.responseBodyFilter}`,
          `上游响应: ${stages.response}`,
        ].join(' | ')
        return (
          <Tooltip title={tooltipText}>
            <Badge
              count={total}
              showZero
              style={{ backgroundColor: total > 0 ? '#1677ff' : '#d9d9d9' }}
            />
          </Tooltip>
        )
      },
    },
    {
      title: '阶段分布',
      key: 'stageSummary',
      render: (_: any, record: K8sResource) => {
        const stages = countPluginsByStage((record as any).spec)
        const total = stages.request + stages.responseFilter + stages.responseBodyFilter + stages.response
        return (
          <Space size={4}>
            {stages.request > 0 && (
              <Tooltip title={`请求阶段: ${stages.request} 个插件`}>
                <Tag color="blue">Req×{stages.request}</Tag>
              </Tooltip>
            )}
            {stages.responseFilter > 0 && (
              <Tooltip title={`响应过滤阶段: ${stages.responseFilter} 个插件`}>
                <Tag color="green">RespFilter×{stages.responseFilter}</Tag>
              </Tooltip>
            )}
            {stages.responseBodyFilter > 0 && (
              <Tooltip title={`响应体阶段: ${stages.responseBodyFilter} 个插件`}>
                <Tag color="orange">BodyFilter×{stages.responseBodyFilter}</Tag>
              </Tooltip>
            )}
            {stages.response > 0 && (
              <Tooltip title={`上游响应阶段: ${stages.response} 个插件`}>
                <Tag color="purple">Resp×{stages.response}</Tag>
              </Tooltip>
            )}
            {total === 0 && <Tag color="default">暂无插件</Tag>}
          </Space>
        )
      },
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
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
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
        dataSource={filteredList}
        loading={isLoading}
        rowKey={(record) => `${record.metadata.namespace}/${record.metadata.name}`}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <EdgionPluginsEditor
        visible={editorVisible}
        mode={editorMode}
        resource={selectedResource}
        onClose={handleEditorClose}
      />
    </div>
  )
}

export default EdgionPluginsList
