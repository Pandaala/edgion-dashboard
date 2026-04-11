import React, { useEffect, useState } from 'react'
import { Modal, Button, Tabs, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import YamlEditor from '@/components/YamlEditor'
import EdgionStreamPluginsForm from './EdgionStreamPluginsForm'
import type { EdgionStreamPlugins } from '@/types/edgion-stream-plugins'
import { createEmpty, normalize, toYaml, fromYaml } from '@/utils/edgionstreamplugins'
import { useT } from '@/i18n'

interface Props {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: EdgionStreamPlugins | null
  onClose: () => void
}

const EdgionStreamPluginsEditor: React.FC<Props> = ({ visible, mode, resource, onClose }) => {
  const t = useT()
  const [activeTab, setActiveTab] = useState<'form' | 'yaml'>('form')
  const [formData, setFormData] = useState<EdgionStreamPlugins>(() => createEmpty())
  const [yamlContent, setYamlContent] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!visible) return
    setActiveTab('form')
    if (mode === 'create') { const e = createEmpty(); setFormData(e); setYamlContent(toYaml(e)) }
    else if (resource) { const n = normalize(resource); setFormData(n); setYamlContent(toYaml(n)) }
  }, [visible, mode, resource])

  const handleTabChange = (key: string) => {
    try {
      if (key === 'yaml') setYamlContent(toYaml(formData))
      else setFormData(fromYaml(yamlContent))
      setActiveTab(key as 'form' | 'yaml')
    } catch (e: any) { message.error(t('msg.tabSwitchFailed', { err: e.message })) }
  }

  const createMutation = useMutation({
    mutationFn: (y: string) => resourceApi.create('edgionstreamplugins', formData.metadata.namespace || 'default', y),
    onSuccess: () => { message.success(t('msg.createOk')); queryClient.invalidateQueries({ queryKey: ['edgionstreamplugins'] }); onClose() },
    onError: (e: any) => message.error(t('msg.createFailed', { err: e.message })),
  })
  const updateMutation = useMutation({
    mutationFn: (y: string) => resourceApi.update('edgionstreamplugins', formData.metadata.namespace || 'default', formData.metadata.name, y),
    onSuccess: () => { message.success(t('msg.updateOk')); queryClient.invalidateQueries({ queryKey: ['edgionstreamplugins'] }); onClose() },
    onError: (e: any) => message.error(t('msg.updateFailed', { err: e.message })),
  })

  const handleSubmit = () => {
    const y = activeTab === 'yaml' ? yamlContent : toYaml(formData)
    if (mode === 'create') createMutation.mutate(y)
    else updateMutation.mutate(y)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isRO = mode === 'view'

  const title =
    mode === 'create'
      ? t('modal.create', { resource: 'EdgionStreamPlugins' })
      : mode === 'edit'
      ? t('modal.edit', { resource: 'EdgionStreamPlugins' })
      : t('modal.view', { resource: 'EdgionStreamPlugins' })

  return (
    <Modal title={title}
      open={visible} onCancel={onClose} width={820}
      footer={isRO ? [<Button key="close" onClick={onClose}>{t('btn.close')}</Button>] : [
        <Button key="cancel" onClick={onClose}>{t('btn.cancel')}</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={isPending}>
          {mode === 'create' ? t('btn.create') : t('btn.save')}
        </Button>,
      ]}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
        { key: 'form', label: t('tab.form'),
          children: <EdgionStreamPluginsForm data={formData} onChange={setFormData} readOnly={isRO} isCreate={mode === 'create'} /> },
        { key: 'yaml', label: t('tab.yaml'),
          children: <YamlEditor value={yamlContent} onChange={setYamlContent} readOnly={isRO} height="480px" /> },
      ]} />
    </Modal>
  )
}

export default EdgionStreamPluginsEditor
