/**
 * 通用页面标题组件
 */

import React from 'react'
import { Typography, Space } from 'antd'

const { Title, Text } = Typography

interface PageHeaderProps {
  title: string
  description?: string
  extra?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, extra }) => (
  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div>
      <Title level={4} style={{ margin: 0 }}>{title}</Title>
      {description && <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>}
    </div>
    {extra && <Space>{extra}</Space>}
  </div>
)

export default PageHeader
