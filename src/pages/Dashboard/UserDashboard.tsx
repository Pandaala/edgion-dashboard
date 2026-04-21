import { useNavigate, useParams } from 'react-router-dom'
import { Row, Col, Card, Statistic, Badge, Button, Space } from 'antd'
import {
  ApiOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { systemApi, apiClient } from '@/api/client'
import { getActiveControllerId } from '@/utils/proxy'
import { useT } from '@/i18n'

function useResourceCount(kind: string) {
  const { controllerId } = useParams<{ controllerId?: string }>()
  return useQuery({
    queryKey: ['count', kind, controllerId ?? ''],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/namespaced/${kind}`, { _silent: true } as any)
        return data.count ?? data.data?.length ?? 0
      } catch {
        return 0
      }
    },
    staleTime: 30 * 1000,
    retry: false,
  })
}

const StatCard = ({
  title, kind, color, icon, path,
}: {
  title: string; kind: string; color: string; icon: React.ReactNode; path: string;
}) => {
  const navigate = useNavigate()
  const { data: count = 0, isLoading } = useResourceCount(kind)

  return (
    <Card
      hoverable
      onClick={() => {
        const cid = getActiveControllerId()
        const prefix = cid ? `/controller/${cid.replace(/\//g, '~')}` : ''
        navigate(`${prefix}${path}`)
      }}
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

const UserDashboard = () => {
  const t = useT()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { controllerId } = useParams<{ controllerId?: string }>()

  const { data: healthData } = useQuery({
    queryKey: ['health', controllerId ?? ''],
    queryFn: systemApi.health,
    staleTime: 15 * 1000,
    retry: false,
  })

  const isHealthy = healthData?.data === 'OK' || healthData?.success === true

  const handleRefreshAll = () => {
    queryClient.invalidateQueries()
  }

  const routeCards = [
    { title: 'HTTPRoute', kind: 'httproute', path: '/routes/http', color: '#3f8600' },
    { title: 'GRPCRoute', kind: 'grpcroute', path: '/routes/grpc', color: '#13c2c2' },
    { title: 'TCPRoute',  kind: 'tcproute',  path: '/routes/tcp',  color: '#1890ff' },
    { title: 'UDPRoute',  kind: 'udproute',  path: '/routes/udp',  color: '#722ed1' },
    { title: 'TLSRoute',  kind: 'tlsroute',  path: '/routes/tls',  color: '#fa8c16' },
  ]

  const serviceSecurityCards = [
    { title: 'Service',          kind: 'service',          path: '/services/list',           color: '#52c41a', icon: <DatabaseOutlined /> },
    { title: 'EndpointSlice',    kind: 'endpointslice',    path: '/services/endpointslices', color: '#597ef7', icon: <DatabaseOutlined /> },
    { title: 'EdgionTls',        kind: 'edgiontls',        path: '/security/tls',            color: '#eb2f96', icon: <SafetyOutlined /> },
    { title: 'BackendTLSPolicy', kind: 'backendtlspolicy', path: '/security/backendtls',     color: '#fa541c', icon: <SafetyOutlined /> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>User Dashboard</h2>
          <span style={{ color: '#888', fontSize: 13 }}>Routes · Services · Certificates</span>
        </div>
        <Space>
          <Badge status={isHealthy ? 'success' : 'error'} text={isHealthy ? t('status.healthy') : t('status.unhealthy')} />
          <Button icon={<ReloadOutlined />} onClick={handleRefreshAll}>{t('dash.refreshAll')}</Button>
        </Space>
      </div>

      {/* Routes */}
      <div style={{ marginBottom: 8, fontSize: 12, color: '#888', fontWeight: 600, letterSpacing: '0.05em' }}>
        {t('nav.routes').toUpperCase()}
      </div>
      <Row gutter={[16, 16]}>
        {routeCards.map((r) => (
          <Col key={r.kind} xs={24} sm={12} lg={Math.floor(24 / routeCards.length) as any}>
            <StatCard title={r.title} kind={r.kind} color={r.color} icon={<ApiOutlined />} path={r.path} />
          </Col>
        ))}
      </Row>

      {/* Services & Security */}
      <div style={{ marginTop: 20, marginBottom: 8, fontSize: 12, color: '#888', fontWeight: 600, letterSpacing: '0.05em' }}>
        {t('nav.services').toUpperCase()} &amp; {t('nav.security').toUpperCase()}
      </div>
      <Row gutter={[16, 16]}>
        {serviceSecurityCards.map((r) => (
          <Col key={r.kind} xs={24} sm={12} lg={6}>
            <StatCard title={r.title} kind={r.kind} color={r.color} icon={r.icon} path={r.path} />
          </Col>
        ))}
      </Row>

      {/* Quick Links */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card title={t('section.quickLinks')} size="small">
            {[
              { label: t('dash.createHttpRoute'), path: '/routes/http', color: '#3f8600' },
              { label: 'Create GRPCRoute', path: '/routes/grpc', color: '#13c2c2' },
              { label: 'Manage Services', path: '/services/list', color: '#52c41a' },
              { label: t('dash.configureTls'), path: '/security/tls', color: '#eb2f96' },
              { label: 'BackendTLS Policy', path: '/security/backendtls', color: '#fa541c' },
            ].map((link) => (
              <Button key={link.path} type="link" onClick={() => {
                const cid = getActiveControllerId()
                const prefix = cid ? `/controller/${cid.replace(/\//g, '~')}` : ''
                navigate(`${prefix}${link.path}`)
              }}
                style={{ display: 'block', textAlign: 'left', padding: '4px 0', color: link.color }}>
                → {link.label}
              </Button>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default UserDashboard
