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
import { useT } from '@/i18n'

const { Search } = Input

const EdgionPluginsList = () => {
  const t = useT()
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
      message.success(t('msg.deleteOk'))
      queryClient.invalidateQueries({ queryKey: ['edgionplugins'] })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (resources: Array<{ namespace: string; name: string }>) =>
      resourceApi.batchDelete('edgionplugins', resources),
    onSuccess: () => {
      message.success(t('msg.batchDeleteOk', { n: selectedRowKeys.length }))
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
      title: t('confirm.deleteTitle'),
      content: t('confirm.deleteMsg', { name }),
      okText: t('confirm.okText'),
      okType: 'danger',
      cancelText: t('btn.cancel'),
      onOk: () => deleteMutation.mutate({ namespace, name }),
    })
  }

  const handleBatchDelete = () => {
    const selectedResources = filteredList
      .filter((p) => selectedRowKeys.includes(`${p.metadata.namespace}/${p.metadata.name}`))
      .map((p) => ({ namespace: p.metadata.namespace!, name: p.metadata.name }))

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
      title: t('col.totalPlugins'),
      key: 'pluginCount',
      render: (_: any, record: K8sResource) => {
        const stages = countPluginsByStage((record as any).spec)
        const total = stages.request + stages.responseFilter + stages.responseBodyFilter + stages.response
        const tooltipText = [
          `${t('plugins.requestStage')}: ${stages.request}`,
          `${t('plugins.responseFilter')}: ${stages.responseFilter}`,
          `${t('plugins.responseBody')}: ${stages.responseBodyFilter}`,
          `${t('plugins.upstreamResponse')}: ${stages.response}`,
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
      title: t('col.stageDistrib'),
      key: 'stageSummary',
      render: (_: any, record: K8sResource) => {
        const stages = countPluginsByStage((record as any).spec)
        const total = stages.request + stages.responseFilter + stages.responseBodyFilter + stages.response
        return (
          <Space size={4}>
            {stages.request > 0 && (
              <Tooltip title={`${t('plugins.requestStage')}: ${t('plugins.stagePlugins', { n: stages.request })}`}>
                <Tag color="blue">Req×{stages.request}</Tag>
              </Tooltip>
            )}
            {stages.responseFilter > 0 && (
              <Tooltip title={`${t('plugins.responseFilter')}: ${t('plugins.stagePlugins', { n: stages.responseFilter })}`}>
                <Tag color="green">RespFilter×{stages.responseFilter}</Tag>
              </Tooltip>
            )}
            {stages.responseBodyFilter > 0 && (
              <Tooltip title={`${t('plugins.responseBody')}: ${t('plugins.stagePlugins', { n: stages.responseBodyFilter })}`}>
                <Tag color="orange">BodyFilter×{stages.responseBodyFilter}</Tag>
              </Tooltip>
            )}
            {stages.response > 0 && (
              <Tooltip title={`${t('plugins.upstreamResponse')}: ${t('plugins.stagePlugins', { n: stages.response })}`}>
                <Tag color="purple">Resp×{stages.response}</Tag>
              </Tooltip>
            )}
            {total === 0 && <Tag color="default">{t('plugins.noPlugins')}</Tag>}
          </Space>
        )
      },
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
        dataSource={filteredList}
        loading={isLoading}
        rowKey={(record) => `${record.metadata.namespace}/${record.metadata.name}`}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('table.totalItems', { n: total }),
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
