import React, { useEffect, useState } from 'react'
import { Modal, Button, Tabs, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import YamlEditor from '@/components/YamlEditor'
import EdgionStreamPluginsForm from './EdgionStreamPluginsForm'
import type { EdgionStreamPlugins } from '@/types/edgion-stream-plugins'
import { createEmpty, normalize, toYaml, fromYaml } from '@/utils/edgionstreamplugins'

interface Props {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: EdgionStreamPlugins | null
  onClose: () => void
}

const EdgionStreamPluginsEditor: React.FC<Props> = ({ visible, mode, resource, onClose }) => {
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
    } catch (e: any) { message.error(`切换失败: ${e.message}`) }
  }

  const createMutation = useMutation({
    mutationFn: (y: string) => resourceApi.create('edgionstreamplugins', formData.metadata.namespace || 'default', y),
    onSuccess: () => { message.success('创建成功'); queryClient.invalidateQueries({ queryKey: ['edgionstreamplugins'] }); onClose() },
    onError: (e: any) => message.error(`创建失败: ${e.message}`),
  })
  const updateMutation = useMutation({
    mutationFn: (y: string) => resourceApi.update('edgionstreamplugins', formData.metadata.namespace || 'default', formData.metadata.name, y),
    onSuccess: () => { message.success('更新成功'); queryClient.invalidateQueries({ queryKey: ['edgionstreamplugins'] }); onClose() },
    onError: (e: any) => message.error(`更新失败: ${e.message}`),
  })

  const handleSubmit = () => {
    const y = activeTab === 'yaml' ? yamlContent : toYaml(formData)
    if (mode === 'create') createMutation.mutate(y)
    else updateMutation.mutate(y)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isRO = mode === 'view'

  return (
    <Modal title={`${mode === 'create' ? '创建' : mode === 'edit' ? '编辑' : '查看'} EdgionStreamPlugins`}
      open={visible} onCancel={onClose} width={820}
      footer={isRO ? [<Button key="close" onClick={onClose}>关闭</Button>] : [
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={isPending}>
          {mode === 'create' ? '创建' : '保存'}
        </Button>,
      ]}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
        { key: 'form', label: '表单',
          children: <EdgionStreamPluginsForm data={formData} onChange={setFormData} readOnly={isRO} isCreate={mode === 'create'} /> },
        { key: 'yaml', label: 'YAML',
          children: <YamlEditor value={yamlContent} onChange={setYamlContent} readOnly={isRO} height="480px" /> },
      ]} />
    </Modal>
  )
}

export default EdgionStreamPluginsEditor
