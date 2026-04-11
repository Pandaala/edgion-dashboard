/**
 * 插件阶段概览
 * 展示 EdgionPlugins 的四个执行阶段及各阶段中的插件列表
 */

import React from 'react'
import { Card, Collapse, Tag, Space, Badge, Typography, Empty } from 'antd'
import type { EdgionPluginsSpec, PluginEntry } from '@/types/edgion-plugins'

const { Text } = Typography

interface PluginStagesSectionProps {
  value?: EdgionPluginsSpec
}

interface StageConfig {
  key: keyof EdgionPluginsSpec
  label: string
  description: string
}

const STAGES: StageConfig[] = [
  {
    key: 'requestPlugins',
    label: '请求阶段 / Request Stage',
    description: '异步执行，处理入站请求（认证、限流、重写等）',
  },
  {
    key: 'upstreamResponseFilterPlugins',
    label: '上游响应过滤阶段 / Response Filter Stage',
    description: '同步执行，处理上游响应头部',
  },
  {
    key: 'upstreamResponseBodyFilterPlugins',
    label: '上游响应体阶段 / Response Body Stage',
    description: '同步执行，处理响应体（带宽限制等）',
  },
  {
    key: 'upstreamResponsePlugins',
    label: '上游响应阶段 / Upstream Response Stage',
    description: '异步执行，上游响应完成后处理',
  },
]

const PluginStagesSection: React.FC<PluginStagesSectionProps> = ({ value = {} }) => {
  const renderPluginList = (plugins: PluginEntry[] | undefined) => {
    if (!plugins?.length) {
      return (
        <Empty
          description="暂无插件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '8px 0' }}
        />
      )
    }
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {plugins.map((plugin, index) => (
          <div
            key={index}
            style={{
              padding: '8px 12px',
              background: '#fafafa',
              borderRadius: 4,
              border: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space>
              <Tag color="blue">{plugin.type}</Tag>
              {plugin.enable === false && <Tag color="orange">已禁用 / Disabled</Tag>}
              {plugin.conditions && <Tag color="purple">有条件 / Conditional</Tag>}
            </Space>
          </div>
        ))}
      </Space>
    )
  }

  const collapseItems = STAGES.map(({ key, label, description }) => {
    const plugins = value[key] as PluginEntry[] | undefined
    const count = plugins?.length ?? 0
    return {
      key,
      label: (
        <Space>
          <Text>{label}</Text>
          <Badge
            count={count}
            showZero
            style={{ backgroundColor: count > 0 ? '#1677ff' : '#d9d9d9' }}
          />
        </Space>
      ),
      children: (
        <>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            {description}
          </Text>
          {renderPluginList(plugins)}
        </>
      ),
    }
  })

  return (
    <Card title="插件配置 / Plugin Configuration" size="small">
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        此处为只读概览，插件详细配置请切换到 YAML 模式进行编辑。
      </Text>
      <Collapse items={collapseItems} />
    </Card>
  )
}

export default PluginStagesSection
