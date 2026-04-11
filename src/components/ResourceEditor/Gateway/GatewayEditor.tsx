/**
 * Gateway 编辑器 Modal
 */

import React, { useEffect, useState } from 'react'
import { Modal, Button, Tabs, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import YamlEditor from '@/components/YamlEditor'
import GatewayForm from './GatewayForm'
import type { Gateway } from '@/types/gateway-api/gateway'
import { createEmptyGateway, normalizeGateway, gatewayToYaml, yamlToGateway } from '@/utils/gateway'
import { useT } from '@/i18n'

interface GatewayEditorProps {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: Gateway | null
  onClose: () => void
}

const GatewayEditor: React.FC<GatewayEditorProps> = ({ visible, mode, resource, onClose }) => {
  const t = useT()
  const [activeTab, setActiveTab] = useState<'form' | 'yaml'>('form')
  const [formData, setFormData] = useState<Gateway>(() => createEmptyGateway())
  const [yamlContent, setYamlContent] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!visible) return
    setActiveTab('form')
    if (mode === 'create') {
      const empty = createEmptyGateway()
      setFormData(empty)
      setYamlContent(gatewayToYaml(empty))
    } else if (resource) {
      const normalized = normalizeGateway(resource)
      setFormData(normalized)
      setYamlContent(gatewayToYaml(normalized))
    }
  }, [visible, mode, resource])

  const handleTabChange = (key: string) => {
    try {
      if (key === 'yaml') setYamlContent(gatewayToYaml(formData))
      else setFormData(yamlToGateway(yamlContent))
      setActiveTab(key as 'form' | 'yaml')
    } catch (e: any) { message.error(t('msg.tabSwitchFailed', { err: e.message })) }
  }

  const createMutation = useMutation({
    mutationFn: (yamlStr: string) =>
      resourceApi.create('gateway', formData.metadata.namespace || 'default', yamlStr),
    onSuccess: () => { message.success(t('msg.createOk')); queryClient.invalidateQueries({ queryKey: ['gateway'] }); onClose() },
    onError: (e: any) => message.error(t('msg.createFailed', { err: e.message })),
  })

  const updateMutation = useMutation({
    mutationFn: (yamlStr: string) =>
      resourceApi.update('gateway', formData.metadata.namespace || 'default', formData.metadata.name, yamlStr),
    onSuccess: () => { message.success(t('msg.updateOk')); queryClient.invalidateQueries({ queryKey: ['gateway'] }); onClose() },
    onError: (e: any) => message.error(t('msg.updateFailed', { err: e.message })),
  })

  const handleSubmit = () => {
    const yamlStr = activeTab === 'yaml' ? yamlContent : gatewayToYaml(formData)
    if (mode === 'create') createMutation.mutate(yamlStr)
    else updateMutation.mutate(yamlStr)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isReadOnly = mode === 'view'

  const title =
    mode === 'create'
      ? t('modal.create', { resource: 'Gateway' })
      : mode === 'edit'
      ? t('modal.edit', { resource: 'Gateway' })
      : t('modal.view', { resource: 'Gateway' })

  return (
    <Modal
      title={title}
      open={visible} onCancel={onClose} width={920}
      footer={
        isReadOnly
          ? [<Button key="close" onClick={onClose}>{t('btn.close')}</Button>]
          : [
              <Button key="cancel" onClick={onClose}>{t('btn.cancel')}</Button>,
              <Button key="submit" type="primary" onClick={handleSubmit} loading={isPending}>
                {mode === 'create' ? t('btn.create') : t('btn.save')}
              </Button>,
            ]
      }
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
        {
          key: 'form', label: t('tab.form'),
          children: <GatewayForm data={formData} onChange={setFormData} readOnly={isReadOnly} isCreate={mode === 'create'} />,
        },
        {
          key: 'yaml', label: t('tab.yaml'),
          children: <YamlEditor value={yamlContent} onChange={setYamlContent} readOnly={isReadOnly} height="500px" />,
        },
      ]} />
    </Modal>
  )
}

export default GatewayEditor
