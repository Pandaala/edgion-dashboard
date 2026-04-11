import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Badge, Button, Table, Space, Tag, Spin, Alert } from 'antd'
import {
  ApiOutlined,
  ClusterOutlined,
  SafetyOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { resourceApi, clusterResourceApi } from '@/api/resources'
import { systemApi } from '@/api/client'

// 资源计数查询 hook
function useResourceCount(kind: string, scope: 'namespaced' | 'cluster' = 'namespaced') {
  return useQuery({
    queryKey: ['count', kind],
    queryFn: async () => {
      try {
        const result = scope === 'namespaced'
          ? await resourceApi.listAll(kind as any)
          : await clusterResourceApi.listAll(kind as any)
        return result.count ?? result.data?.length ?? 0
      } catch {
        return 0
      }
    },
    staleTime: 30 * 1000,
    retry: false,
  })
}

const StatCard = ({
  title, kind, scope, color, icon, path,
}: {
  title: string; kind: string; scope?: 'namespaced' | 'cluster';
  color: string; icon: React.ReactNode; path?: string;
}) => {
  const navigate = useNavigate()
  const { data: count = 0, isLoading } = useResourceCount(kind, scope)

  return (
    <Card
      hoverable={!!path}
      onClick={() => path && navigate(path)}
      style={{ cursor: path ? 'pointer' : 'default' }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <Statistic
        title={title}
        value={isLoading ? '-' : count}
        prefix={icon}
        valueStyle={{ color, fontSize: 28 }}
        loading={isLoading}
      />
    </Card>
  )
}

const Dashboard = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: systemApi.health,
    staleTime: 15 * 1000,
    retry: false,
  })

  const { data: serverInfo } = useQuery({
    queryKey: ['server-info'],
    queryFn: systemApi.serverInfo,
    staleTime: 30 * 1000,
    retry: false,
  })

  const isHealthy = healthData?.data === 'OK' || healthData?.success === true
  const isReady = serverInfo?.data?.ready === true

  const handleRefreshAll = () => {
    queryClient.invalidateQueries()
  }

  // 按分类统计表格的数据
  const categoryStats = [
    { category: '路由', resources: [
      { name: 'HTTPRoute', kind: 'httproute', path: '/routes/http' },
      { name: 'GRPCRoute', kind: 'grpcroute', path: '/routes/grpc' },
      { name: 'TCPRoute', kind: 'tcproute', path: '/routes/tcp' },
      { name: 'UDPRoute', kind: 'udproute', path: '/routes/udp' },
      { name: 'TLSRoute', kind: 'tlsroute', path: '/routes/tls' },
    ]},
    { category: '基础设施', resources: [
      { name: 'Gateway', kind: 'gateway', path: '/infrastructure/gateways' },
      { name: 'GatewayClass', kind: 'gatewayclass', scope: 'cluster' as const, path: '/infrastructure/gatewayclasses' },
      { name: 'Service', kind: 'service', path: '/infrastructure/services' },
      { name: 'EndpointSlice', kind: 'endpointslice', path: '/infrastructure/endpointslices' },
    ]},
    { category: '安全配置', resources: [
      { name: 'EdgionTls', kind: 'edgiontls', path: '/security/tls' },
      { name: 'Secret', kind: 'secret', path: '/security/secrets' },
    ]},
    { category: '插件管理', resources: [
      { name: 'EdgionPlugins', kind: 'edgionplugins', path: '/plugins' },
      { name: 'EdgionStreamPlugins', kind: 'edgionstreamplugins', path: '/plugins/stream' },
    ]},
    { category: '系统配置', resources: [
      { name: 'EdgionGatewayConfig', kind: 'edgiongatewayconfig', scope: 'cluster' as const, path: '/system/config' },
      { name: 'LinkSys', kind: 'linksys', path: '/system/linksys' },
    ]},
  ]

  return (
    <div>
      {/* 顶部标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Edgion Controller Dashboard</h2>
          <span style={{ color: '#888', fontSize: 13 }}>
            Server ID: {serverInfo?.data?.server_id || '—'}
          </span>
        </div>
        <Space>
          <Badge
            status={isHealthy ? 'success' : 'error'}
            text={isHealthy ? '健康' : '异常'}
          />
          <Badge
            status={isReady ? 'success' : 'warning'}
            text={isReady ? '就绪' : '未就绪'}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefreshAll}>刷新全部</Button>
        </Space>
      </div>

      {/* 主要统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="HTTPRoute" kind="httproute" color="#3f8600"
            icon={<ApiOutlined />} path="/routes/http" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Gateway" kind="gateway" color="#722ed1"
            icon={<GlobalOutlined />} path="/infrastructure/gateways" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="EdgionPlugins" kind="edgionplugins" color="#1890ff"
            icon={<AppstoreOutlined />} path="/plugins" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Service" kind="service" color="#fa8c16"
            icon={<ClusterOutlined />} path="/infrastructure/services" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="GRPCRoute" kind="grpcroute" color="#13c2c2"
            icon={<ApiOutlined />} path="/routes/grpc" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="EdgionTls" kind="edgiontls" color="#52c41a"
            icon={<SafetyOutlined />} path="/security/tls" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Secret" kind="secret" color="#eb2f96"
            icon={<SafetyOutlined />} path="/security/secrets" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="StreamPlugins" kind="edgionstreamplugins" color="#597ef7"
            icon={<AppstoreOutlined />} path="/plugins/stream" />
        </Col>
      </Row>

      {/* 资源分类概览 + 系统信息 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="资源总览" size="small">
            <ResourceSummaryTable categories={categoryStats} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="系统信息" size="small" style={{ marginBottom: 16 }}>
            <SystemInfoPanel serverInfo={serverInfo?.data} isHealthy={isHealthy} isReady={isReady} />
          </Card>
          <Card title="快速入口" size="small">
            <QuickLinks navigate={navigate} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

// 资源总览表格
const ResourceSummaryTable = ({ categories }: {
  categories: Array<{ category: string; resources: Array<{ name: string; kind: string; scope?: 'namespaced' | 'cluster'; path: string }> }>
}) => {
  const navigate = useNavigate()

  const rows: Array<{ key: string; category: string; name: string; kind: string; scope?: 'namespaced' | 'cluster'; path: string }> = []
  categories.forEach(({ category, resources }) => {
    resources.forEach((r, i) => {
      rows.push({ key: r.kind, category: i === 0 ? category : '', ...r })
    })
  })

  const columns = [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string) => v ? <strong>{v}</strong> : null,
    },
    {
      title: '资源类型',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row: any) => (
        <Button type="link" size="small" onClick={() => navigate(row.path)} style={{ padding: 0 }}>
          {name}
        </Button>
      ),
    },
    {
      title: 'Scope',
      key: 'scope',
      width: 100,
      render: (_: any, row: any) => (
        <Tag color={row.scope === 'cluster' ? 'purple' : 'blue'}>
          {row.scope === 'cluster' ? 'Cluster' : 'Namespaced'}
        </Tag>
      ),
    },
    {
      title: '数量',
      key: 'count',
      width: 80,
      render: (_: any, row: any) => <ResourceCountCell kind={row.kind} scope={row.scope} />,
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={rows}
      pagination={false}
      size="small"
      showHeader
      bordered={false}
    />
  )
}

const ResourceCountCell = ({ kind, scope }: { kind: string; scope?: 'namespaced' | 'cluster' }) => {
  const { data: count, isLoading } = useResourceCount(kind, scope)
  if (isLoading) return <Spin size="small" />
  const n = count ?? 0
  return <strong style={{ color: n > 0 ? '#1890ff' : '#888' }}>{n}</strong>
}

// 系统信息面板
const SystemInfoPanel = ({ serverInfo, isHealthy, isReady }: {
  serverInfo?: { server_id: string; ready: boolean }
  isHealthy: boolean
  isReady: boolean
}) => (
  <div style={{ fontSize: 13 }}>
    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#888' }}>Controller 状态</span>
      <Badge status={isHealthy ? 'success' : 'error'} text={isHealthy ? '运行中' : '异常'} />
    </div>
    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#888' }}>就绪状态</span>
      <Badge status={isReady ? 'success' : 'warning'} text={isReady ? 'Ready' : 'Not Ready'} />
    </div>
    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#888' }}>Server ID</span>
      <code style={{ fontSize: 11 }}>{serverInfo?.server_id || '—'}</code>
    </div>
    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#888' }}>Admin API</span>
      <span>:5800</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#888' }}>gRPC</span>
      <span>:50051</span>
    </div>
  </div>
)

// 快速入口
const QuickLinks = ({ navigate }: { navigate: (path: string) => void }) => {
  const links = [
    { label: '创建 HTTPRoute', path: '/routes/http', color: '#3f8600' },
    { label: '管理 Gateway', path: '/infrastructure/gateways', color: '#722ed1' },
    { label: '配置 EdgionTls', path: '/security/tls', color: '#52c41a' },
    { label: '管理插件', path: '/plugins', color: '#1890ff' },
    { label: '系统配置', path: '/system/config', color: '#fa8c16' },
  ]

  return (
    <div>
      {links.map((link) => (
        <Button
          key={link.path}
          type="link"
          onClick={() => navigate(link.path)}
          style={{ display: 'block', textAlign: 'left', padding: '4px 0', color: link.color }}
        >
          → {link.label}
        </Button>
      ))}
    </div>
  )
}

export default Dashboard
