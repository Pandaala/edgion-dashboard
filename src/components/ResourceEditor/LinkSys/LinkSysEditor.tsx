import React, { useEffect, useState } from 'react'
import { Modal, Button, Tabs, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import YamlEditor from '@/components/YamlEditor'
import LinkSysForm from './LinkSysForm'
import type { LinkSys } from '@/types/link-sys'
import { createEmpty, normalize, toYaml, fromYaml } from '@/utils/linksys'
import { useT } from '@/i18n'

interface Props {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: LinkSys | null
  onClose: () => void
}

const LinkSysEditor: React.FC<Props> = ({ visible, mode, resource, onClose }) => {
  const t = useT()
  const [activeTab, setActiveTab] = useState<'form' | 'yaml'>('form')
  const [formData, setFormData] = useState<LinkSys>(() => createEmpty())
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
    mutationFn: (y: string) => resourceApi.create('linksys', formData.metadata.namespace || 'default', y),
    onSuccess: () => { message.success(t('msg.createOk')); queryClient.invalidateQueries({ queryKey: ['linksys'] }); onClose() },
    onError: (e: any) => message.error(t('msg.createFailed', { err: e.message })),
  })
  const updateMutation = useMutation({
    mutationFn: (y: string) => resourceApi.update('linksys', formData.metadata.namespace || 'default', formData.metadata.name, y),
    onSuccess: () => { message.success(t('msg.updateOk')); queryClient.invalidateQueries({ queryKey: ['linksys'] }); onClose() },
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
      ? t('modal.create', { resource: 'LinkSys' })
      : mode === 'edit'
      ? t('modal.edit', { resource: 'LinkSys' })
      : t('modal.view', { resource: 'LinkSys' })

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
          children: <LinkSysForm data={formData} onChange={setFormData} readOnly={isRO} isCreate={mode === 'create'} /> },
        { key: 'yaml', label: t('tab.yaml'),
          children: <YamlEditor value={yamlContent} onChange={setYamlContent} readOnly={isRO} height="480px" /> },
      ]} />
    </Modal>
  )
}

export default LinkSysEditor
