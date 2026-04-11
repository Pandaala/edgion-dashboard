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
import { useT } from '@/i18n'

const EdgionGatewayConfigPage = () => {
  const t = useT()
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
    onSuccess: () => { message.success(t('msg.deleteOk')); queryClient.invalidateQueries({ queryKey: ['edgiongatewayconfig'] }) },
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
        message.success(t('msg.createOk'))
      } else {
        await clusterResourceApi.update('edgiongatewayconfig', selectedResource!.metadata.name, yamlContent)
        message.success(t('msg.updateOk'))
      }
      queryClient.invalidateQueries({ queryKey: ['edgiongatewayconfig'] })
      setEditorVisible(false)
    } catch (e: any) { message.error(t('msg.opFailed', { err: e.message })) }
    finally { setSubmitLoading(false) }
  }

  const columns = [
    { title: t('col.name'), dataIndex: ['metadata', 'name'], key: 'name' },
    { title: 'MaxRetries', key: 'retries',
      render: (_: any, r: K8sResource) => r.spec?.maxRetries ?? '-' },
    { title: 'Preflight Mode', key: 'preflight',
      render: (_: any, r: K8sResource) => r.spec?.preflightPolicy?.mode
        ? <Tag>{r.spec.preflightPolicy.mode}</Tag> : '-' },
    { title: 'Real IP Header', key: 'realip',
      render: (_: any, r: K8sResource) => r.spec?.realIp?.realIpHeader || '-' },
    {
      title: t('col.actions'), key: 'actions', width: 160,
      render: (_: any, r: K8sResource) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openEditor('view', r)}>{t('btn.view')}</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor('edit', r)}>{t('btn.edit')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: t('confirm.deleteTitle'), content: t('confirm.deleteMsg', { name: r.metadata.name }),
              okText: t('confirm.okText'), okType: 'danger', cancelText: t('btn.cancel'),
              onOk: () => deleteMutation.mutate(r.metadata.name),
            })}>{t('btn.delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('create')}>{`${t('btn.create')} EdgionGatewayConfig`}</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
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
