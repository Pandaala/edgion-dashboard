/**
 * EdgionPlugins 主编辑器
 * 支持表单模式（元数据 + 插件概览）和 YAML 模式切换，带双向同步
 */

import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Button, Space, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import EdgionPluginsForm from './EdgionPluginsForm'
import YamlEditor from '@/components/YamlEditor'
import { resourceApi } from '@/api/resources'
import {
  createEmptyEdgionPlugins,
  normalizeEdgionPlugins,
  edgionPluginsToYAML,
  yamlToEdgionPlugins,
  DEFAULT_EDGION_PLUGINS_YAML,
} from '@/utils/edgionplugins'
import type { EdgionPlugins } from '@/types/edgion-plugins'
import type { K8sResource } from '@/api/types'

const { TabPane } = Tabs

interface EdgionPluginsEditorProps {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: K8sResource | null
  onClose: () => void
}

const EdgionPluginsEditor: React.FC<EdgionPluginsEditorProps> = ({
  visible,
  mode: initialMode,
  resource,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'yaml'>('form')
  const [formData, setFormData] = useState<EdgionPlugins | null>(null)
  const [yamlContent, setYamlContent] = useState<string>('')
  const queryClient = useQueryClient()

  const isReadOnly = initialMode === 'view'

  // 初始化数据
  useEffect(() => {
    if (visible) {
      if (resource) {
        const normalized = normalizeEdgionPlugins(resource as unknown as EdgionPlugins)
        setFormData(normalized)
        setYamlContent(edgionPluginsToYAML(normalized))
      } else {
        const empty = createEmptyEdgionPlugins()
        setFormData(empty)
        setYamlContent(DEFAULT_EDGION_PLUGINS_YAML)
      }
      setActiveTab('form')
    }
  }, [visible, initialMode, resource])

  // 表单 → YAML 同步
  const handleFormChange = (newFormData: EdgionPlugins) => {
    setFormData(newFormData)
    try {
      const normalized = normalizeEdgionPlugins(newFormData)
      setYamlContent(edgionPluginsToYAML(normalized))
    } catch (e) {
      console.error('Form to YAML conversion error:', e)
    }
  }

  // YAML → 表单同步
  const handleYamlChange = (newYaml: string) => {
    setYamlContent(newYaml)
    try {
      const parsed = yamlToEdgionPlugins(newYaml)
      setFormData(normalizeEdgionPlugins(parsed))
    } catch (e) {
      console.error('YAML parse error:', e)
    }
  }

  // 创建 Mutation
  const createMutation = useMutation({
    mutationFn: ({ namespace, name, content }: { namespace: string; name: string; content: string }) =>
      resourceApi.create('edgionplugins', namespace, content),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: ['edgionplugins'] })
      onClose()
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.message}`)
    },
  })

  // 更新 Mutation
  const updateMutation = useMutation({
    mutationFn: ({ namespace, name, content }: { namespace: string; name: string; content: string }) =>
      resourceApi.update('edgionplugins', namespace, name, content),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['edgionplugins'] })
      onClose()
    },
    onError: (error: any) => {
      message.error(`更新失败: ${error.message}`)
    },
  })

  // 提交处理
  const handleSubmit = async () => {
    try {
      let parsedResource: EdgionPlugins
      let contentToSubmit: string

      if (activeTab === 'form') {
        if (!formData) {
          message.error('表单数据为空')
          return
        }
        parsedResource = normalizeEdgionPlugins(formData)
        contentToSubmit = edgionPluginsToYAML(parsedResource)
      } else {
        parsedResource = yamlToEdgionPlugins(yamlContent)
        contentToSubmit = edgionPluginsToYAML(parsedResource)
      }

      const name = parsedResource.metadata?.name
      const namespace = parsedResource.metadata?.namespace

      if (!name || !namespace) {
        message.error('必须填写 metadata.name 和 metadata.namespace')
        return
      }

      if (initialMode === 'create') {
        createMutation.mutate({ namespace, name, content: contentToSubmit })
      } else if (resource) {
        if (name !== resource.metadata.name || namespace !== resource.metadata.namespace) {
          message.error('不允许修改资源的名称或命名空间')
          return
        }
        updateMutation.mutate({ namespace, name, content: contentToSubmit })
      }
    } catch (e: any) {
      message.error(`提交失败: ${e.message || '未知错误'}`)
    }
  }

  const title =
    initialMode === 'create'
      ? '创建 EdgionPlugins'
      : initialMode === 'edit'
      ? `编辑 ${resource?.metadata.name}`
      : `查看 ${resource?.metadata.name}`

  const footer = (
    <Space>
      <Button onClick={onClose}>
        {initialMode === 'view' ? '关闭' : '取消'}
      </Button>
      {initialMode !== 'view' && (
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {initialMode === 'create' ? '创建' : '保存'}
        </Button>
      )}
    </Space>
  )

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      footer={footer}
      width={900}
      destroyOnClose
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'form' | 'yaml')}>
        <TabPane tab="表单模式 / Form" key="form">
          {formData && (
            <EdgionPluginsForm
              value={formData}
              onChange={handleFormChange}
              disabled={isReadOnly}
              isCreate={initialMode === 'create'}
            />
          )}
        </TabPane>
        <TabPane tab="YAML 模式 / YAML" key="yaml">
          <YamlEditor
            value={yamlContent}
            onChange={handleYamlChange}
            readOnly={isReadOnly}
            height="65vh"
          />
        </TabPane>
      </Tabs>
    </Modal>
  )
}

export default EdgionPluginsEditor
