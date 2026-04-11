/**
 * EdgionGatewayConfig 管理页面（集群级，通常单例）
 */

import { useState } from 'react'
import { Table, Button, Space, Modal, message, Tag } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clusterResourceApi } from '@/api/resources'
import type { K8sResource } from '@/api/types'
import SimpleResourceEditor from '@/components/ResourceEditor/common/SimpleResourceEditor'
import { DEFAULT_YAML } from '@/utils/edgiongatewayconfig'

const EdgionGatewayConfigPage = () => {
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedResource, setSelectedResource] = useState<K8sResource | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['edgiongatewayconfig'],
    queryFn: () => clusterResourceApi.listAll<K8sResource>('edgiongatewayconfig'),
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => clusterResourceApi.delete('edgiongatewayconfig', name),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['edgiongatewayconfig'] }) },
  })

  const items = data?.data || []

  const openEditor = (mode: 'create' | 'edit' | 'view', resource?: K8sResource) => {
    setEditorMode(mode); setSelectedResource(resource || null); setEditorVisible(true)
  }

  const handleSubmit = async (yamlContent: string) => {
    setSubmitLoading(true)
    try {
      if (editorMode === 'create') {
        await clusterResourceApi.create('edgiongatewayconfig', yamlContent)
        message.success('创建成功')
      } else {
        await clusterResourceApi.update('edgiongatewayconfig', selectedResource!.metadata.name, yamlContent)
        message.success('更新成功')
      }
      queryClient.invalidateQueries({ queryKey: ['edgiongatewayconfig'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(`操作失败: ${e.message}`) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: '名称', dataIndex: ['metadata', 'name'], key: 'name' },
    { title: 'MaxRetries', key: 'retries',
      render: (_: any, r: K8sResource) => r.spec?.maxRetries ?? '-' },
    { title: 'Preflight Mode', key: 'preflight',
      render: (_: any, r: K8sResource) => r.spec?.preflightPolicy?.mode
        ? <Tag>{r.spec.preflightPolicy.mode}</Tag> : '-' },
    { title: 'Real IP Header', key: 'realip',
      render: (_: any, r: K8sResource) => r.spec?.realIp?.realIpHeader || '-' },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: '确认删除', content: `确定要删除 ${r.metadata.name} 吗？`,
              okType: 'danger', onOk: () => deleteMutation.mutate(r.metadata.name),
            })}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>创建 EdgionGatewayConfig</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
      </div>
      <Table rowKey={(r) => r.metadata.name} columns={columns} dataSource={items}
        loading={isLoading} pagination={{ pageSize: 20 }} size="middle" />
      <SimpleResourceEditor visible={editorVisible} mode={editorMode} resource={selectedResource}
        title="EdgionGatewayConfig" defaultYaml={DEFAULT_YAML} onClose={() => setEditorVisible(false)}
        onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  )
}

export default EdgionGatewayConfigPage
