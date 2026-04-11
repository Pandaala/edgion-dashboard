/**
 * 通用简化编辑器 — 只有 YAML 编辑器，无表单标签
 * 适用于：Service, EndpointSlice, GatewayClass, PluginMetaData, BackendTLSPolicy, ReferenceGrant 等
 */

import React, { useEffect, useState } from 'react'
import { Modal, Button, message } from 'antd'
import * as yaml from 'js-yaml'
import YamlEditor from '@/components/YamlEditor'
import type { K8sResource } from '@/api/types'

interface SimpleResourceEditorProps {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: K8sResource | null
  title: string
  defaultYaml?: string
  onClose: () => void
  onSubmit: (yamlContent: string) => Promise<void>
  loading?: boolean
}

const SimpleResourceEditor: React.FC<SimpleResourceEditorProps> = ({
  visible,
  mode,
  resource,
  title,
  defaultYaml = '',
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [yamlContent, setYamlContent] = useState('')

  useEffect(() => {
    if (!visible) return
    if (mode === 'create') {
      setYamlContent(defaultYaml)
    } else if (resource) {
      try {
        setYamlContent(yaml.dump(resource, { lineWidth: -1, noRefs: true }))
      } catch {
        setYamlContent('')
      }
    }
  }, [visible, mode, resource, defaultYaml])

  const handleSubmit = async () => {
    if (!yamlContent.trim()) {
      message.error('YAML 内容不能为空')
      return
    }
    try {
      yaml.load(yamlContent)
    } catch (e: any) {
      message.error(`YAML 格式错误: ${e.message}`)
      return
    }
    await onSubmit(yamlContent)
  }

  const modalTitle = mode === 'create' ? `创建 ${title}` : mode === 'edit' ? `编辑 ${title}` : `查看 ${title}`

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onClose}
      width={860}
      footer={
        mode === 'view'
          ? [<Button key="close" onClick={onClose}>关闭</Button>]
          : [
              <Button key="cancel" onClick={onClose}>取消</Button>,
              <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
                {mode === 'create' ? '创建' : '保存'}
              </Button>,
            ]
      }
    >
      <YamlEditor
        value={yamlContent}
        onChange={setYamlContent}
        readOnly={mode === 'view'}
        height="500px"
      />
    </Modal>
  )
}

export default SimpleResourceEditor
