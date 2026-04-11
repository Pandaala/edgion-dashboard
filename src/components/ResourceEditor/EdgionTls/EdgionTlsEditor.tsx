/**
 * EdgionTls 编辑器 Modal
 */

import React, { useEffect, useState } from 'react'
import { Modal, Button, Tabs, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import YamlEditor from '@/components/YamlEditor'
import EdgionTlsForm from './EdgionTlsForm'
import type { EdgionTls } from '@/types/edgion-tls'
import { createEmptyEdgionTls, normalizeEdgionTls, edgionTlsToYaml, yamlToEdgionTls } from '@/utils/edgiontls'

interface EdgionTlsEditorProps {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: EdgionTls | null
  onClose: () => void
}

const EdgionTlsEditor: React.FC<EdgionTlsEditorProps> = ({ visible, mode, resource, onClose }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'yaml'>('form')
  const [formData, setFormData] = useState<EdgionTls>(() => createEmptyEdgionTls())
  const [yamlContent, setYamlContent] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!visible) return
    setActiveTab('form')
    if (mode === 'create') {
      const empty = createEmptyEdgionTls()
      setFormData(empty)
      setYamlContent(edgionTlsToYaml(empty))
    } else if (resource) {
      const normalized = normalizeEdgionTls(resource)
      setFormData(normalized)
      setYamlContent(edgionTlsToYaml(normalized))
    }
  }, [visible, mode, resource])

  const handleTabChange = (key: string) => {
    try {
      if (key === 'yaml') setYamlContent(edgionTlsToYaml(formData))
      else setFormData(yamlToEdgionTls(yamlContent))
      setActiveTab(key as 'form' | 'yaml')
    } catch (e: any) { message.error(`切换失败: ${e.message}`) }
  }

  const createMutation = useMutation({
    mutationFn: (yamlStr: string) =>
      resourceApi.create('edgiontls', formData.metadata.namespace || 'default', yamlStr),
    onSuccess: () => { message.success('创建成功'); queryClient.invalidateQueries({ queryKey: ['edgiontls'] }); onClose() },
    onError: (e: any) => message.error(`创建失败: ${e.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: (yamlStr: string) =>
      resourceApi.update('edgiontls', formData.metadata.namespace || 'default', formData.metadata.name, yamlStr),
    onSuccess: () => { message.success('更新成功'); queryClient.invalidateQueries({ queryKey: ['edgiontls'] }); onClose() },
    onError: (e: any) => message.error(`更新失败: ${e.message}`),
  })

  const handleSubmit = () => {
    const yamlStr = activeTab === 'yaml' ? yamlContent : edgionTlsToYaml(formData)
    if (mode === 'create') createMutation.mutate(yamlStr)
    else updateMutation.mutate(yamlStr)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isReadOnly = mode === 'view'

  return (
    <Modal
      title={`${mode === 'create' ? '创建' : mode === 'edit' ? '编辑' : '查看'} EdgionTls`}
      open={visible} onCancel={onClose} width={860}
      footer={
        isReadOnly
          ? [<Button key="close" onClick={onClose}>关闭</Button>]
          : [
              <Button key="cancel" onClick={onClose}>取消</Button>,
              <Button key="submit" type="primary" onClick={handleSubmit} loading={isPending}>
                {mode === 'create' ? '创建' : '保存'}
              </Button>,
            ]
      }
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
        { key: 'form', label: '表单',
          children: <EdgionTlsForm data={formData} onChange={setFormData} readOnly={isReadOnly} isCreate={mode === 'create'} /> },
        { key: 'yaml', label: 'YAML',
          children: <YamlEditor value={yamlContent} onChange={setYamlContent} readOnly={isReadOnly} height="500px" /> },
      ]} />
    </Modal>
  )
}

export default EdgionTlsEditor
