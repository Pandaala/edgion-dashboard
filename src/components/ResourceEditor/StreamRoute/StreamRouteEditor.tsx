/**
 * StreamRoute 编辑器 Modal — 共享用于 TCPRoute / UDPRoute / TLSRoute
 */

import React, { useEffect, useState } from 'react'
import { Modal, Button, Tabs, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '@/api/resources'
import YamlEditor from '@/components/YamlEditor'
import StreamRouteForm from './StreamRouteForm'
import type { StreamRouteKind } from './StreamRouteForm'
import type { TCPRoute } from '@/types/gateway-api/tcproute'
import type { UDPRoute } from '@/types/gateway-api/udproute'
import type { TLSRoute } from '@/types/gateway-api/tlsroute'
import {
  createEmptyTCPRoute, normalizeTCPRoute, tcpRouteToYaml, yamlToTCPRoute,
} from '@/utils/tcproute'
import {
  createEmptyUDPRoute, normalizeUDPRoute, udpRouteToYaml, yamlToUDPRoute,
} from '@/utils/udproute'
import {
  createEmptyTLSRoute, normalizeTLSRoute, tlsRouteToYaml, yamlToTLSRoute,
} from '@/utils/tlsroute'
import type { ResourceKind } from '@/api/types'

type RouteData = TCPRoute | UDPRoute | TLSRoute

interface StreamRouteEditorProps {
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  kind: StreamRouteKind
  resource?: RouteData | null
  onClose: () => void
}

const KIND_MAP: Record<StreamRouteKind, {
  apiKind: ResourceKind
  label: string
  createEmpty: () => RouteData
  normalize: (raw: any) => RouteData
  toYaml: (r: RouteData) => string
  fromYaml: (s: string) => RouteData
}> = {
  TCPRoute: {
    apiKind: 'tcproute',
    label: 'TCPRoute',
    createEmpty: createEmptyTCPRoute,
    normalize: normalizeTCPRoute,
    toYaml: (r) => tcpRouteToYaml(r as TCPRoute),
    fromYaml: yamlToTCPRoute,
  },
  UDPRoute: {
    apiKind: 'udproute',
    label: 'UDPRoute',
    createEmpty: createEmptyUDPRoute,
    normalize: normalizeUDPRoute,
    toYaml: (r) => udpRouteToYaml(r as UDPRoute),
    fromYaml: yamlToUDPRoute,
  },
  TLSRoute: {
    apiKind: 'tlsroute',
    label: 'TLSRoute',
    createEmpty: createEmptyTLSRoute,
    normalize: normalizeTLSRoute,
    toYaml: (r) => tlsRouteToYaml(r as TLSRoute),
    fromYaml: yamlToTLSRoute,
  },
}

const StreamRouteEditor: React.FC<StreamRouteEditorProps> = ({
  visible, mode, kind, resource, onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'yaml'>('form')
  const [formData, setFormData] = useState<RouteData>(() => KIND_MAP[kind].createEmpty())
  const [yamlContent, setYamlContent] = useState('')
  const queryClient = useQueryClient()

  const meta = KIND_MAP[kind]

  useEffect(() => {
    if (!visible) return
    setActiveTab('form')
    if (mode === 'create') {
      const empty = meta.createEmpty()
      setFormData(empty)
      setYamlContent(meta.toYaml(empty))
    } else if (resource) {
      const normalized = meta.normalize(resource)
      setFormData(normalized)
      setYamlContent(meta.toYaml(normalized))
    }
  }, [visible, mode, resource, kind])

  const handleTabChange = (key: string) => {
    try {
      if (key === 'yaml') {
        setYamlContent(meta.toYaml(formData))
      } else {
        setFormData(meta.fromYaml(yamlContent))
      }
      setActiveTab(key as 'form' | 'yaml')
    } catch (e: any) {
      message.error(`切换失败: ${e.message}`)
    }
  }

  const createMutation = useMutation({
    mutationFn: (yamlStr: string) =>
      resourceApi.create(meta.apiKind, formData.metadata.namespace || 'default', yamlStr),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: [meta.apiKind] })
      onClose()
    },
    onError: (e: any) => message.error(`创建失败: ${e.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: (yamlStr: string) =>
      resourceApi.update(
        meta.apiKind,
        formData.metadata.namespace || 'default',
        formData.metadata.name,
        yamlStr,
      ),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: [meta.apiKind] })
      onClose()
    },
    onError: (e: any) => message.error(`更新失败: ${e.message}`),
  })

  const handleSubmit = () => {
    const yamlStr = activeTab === 'yaml' ? yamlContent : meta.toYaml(formData)
    if (mode === 'create') {
      createMutation.mutate(yamlStr)
    } else {
      updateMutation.mutate(yamlStr)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isReadOnly = mode === 'view'

  return (
    <Modal
      title={`${mode === 'create' ? '创建' : mode === 'edit' ? '编辑' : '查看'} ${meta.label}`}
      open={visible}
      onCancel={onClose}
      width={860}
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
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'form',
            label: '表单',
            children: (
              <StreamRouteForm
                kind={kind}
                data={formData}
                onChange={setFormData}
                readOnly={isReadOnly}
                isCreate={mode === 'create'}
              />
            ),
          },
          {
            key: 'yaml',
            label: 'YAML',
            children: (
              <YamlEditor
                value={yamlContent}
                onChange={setYamlContent}
                readOnly={isReadOnly}
                height="500px"
              />
            ),
          },
        ]}
      />
    </Modal>
  )
}

export default StreamRouteEditor
