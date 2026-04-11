import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Badge, Button, Space, Spin } from 'antd'
import {
  ClusterOutlined,
  AppstoreOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { resourceApi, clusterResourceApi } from '@/api/resources'
import { systemApi } from '@/api/client'
import { useT } from '@/i18n'

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

const ResourceCountCell = ({ kind, scope }: { kind: string; scope?: 'namespaced' | 'cluster' }) => {
  const { data: count, isLoading } = useResourceCount(kind, scope)
  if (isLoading) return <Spin size="small" />
  const n = count ?? 0
  return <strong style={{ color: n > 0 ? '#1890ff' : '#888' }}>{n}</strong>
}

const Dashboard = () => {
  const t = useT()
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

  const opsResources = [
    { title: 'Gateway', kind: 'gateway', path: '/infrastructure/gateways', color: '#722ed1', icon: <ClusterOutlined /> },
    { title: 'GatewayClass', kind: 'gatewayclass', scope: 'cluster' as const, path: '/infrastructure/gatewayclasses', color: '#1890ff', icon: <ClusterOutlined /> },
    { title: 'EdgionPlugins', kind: 'edgionplugins', path: '/plugins', color: '#13c2c2', icon: <AppstoreOutlined /> },
    { title: 'StreamPlugins', kind: 'edgionstreamplugins', path: '/plugins/stream', color: '#597ef7', icon: <AppstoreOutlined /> },
    { title: 'PluginMetaData', kind: 'pluginmetadata', path: '/plugins/metadata', color: '#fa541c', icon: <AppstoreOutlined /> },
    { title: 'GatewayConfig', kind: 'edgiongatewayconfig', scope: 'cluster' as const, path: '/system/config', color: '#fa8c16', icon: <SettingOutlined /> },
    { title: 'LinkSys', kind: 'linksys', path: '/system/linksys', color: '#52c41a', icon: <SettingOutlined /> },
    { title: 'Acme', kind: 'edgionacme', path: '/system/acme', color: '#eb2f96', icon: <SettingOutlined /> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Ops Dashboard</h2>
          <span style={{ color: '#888', fontSize: 13 }}>
            Server ID: {serverInfo?.data?.server_id || '—'}
          </span>
        </div>
        <Space>
          <Badge status={isHealthy ? 'success' : 'error'} text={isHealthy ? t('status.healthy') : t('status.unhealthy')} />
          <Badge status={isReady ? 'success' : 'warning'} text={isReady ? t('status.ready') : t('status.notReady')} />
          <Button icon={<ReloadOutlined />} onClick={handleRefreshAll}>{t('dash.refreshAll')}</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {opsResources.map((r) => (
          <Col key={r.kind} xs={24} sm={12} lg={6}>
            <StatCard title={r.title} kind={r.kind} scope={r.scope} color={r.color} icon={r.icon} path={r.path} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card title={t('section.sysInfo')} size="small">
            <div style={{ fontSize: 13 }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>{t('dash.controllerStatus')}</span>
                <Badge status={isHealthy ? 'success' : 'error'} text={isHealthy ? t('status.running') : t('status.unhealthy')} />
              </div>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>{t('dash.readyStatus')}</span>
                <Badge status={isReady ? 'success' : 'warning'} text={isReady ? t('status.ready') : t('status.notReady')} />
              </div>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>{t('dash.serverId')}</span>
                <code style={{ fontSize: 11 }}>{serverInfo?.data?.server_id || '—'}</code>
              </div>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>{t('dash.adminApi')}</span>
                <span>:5800</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>{t('dash.grpc')}</span>
                <span>:50051</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('section.quickLinks')} size="small">
            {[
              { label: t('dash.manageGateway'), path: '/infrastructure/gateways', color: '#722ed1' },
              { label: t('dash.managePlugins'), path: '/plugins', color: '#13c2c2' },
              { label: t('dash.sysConfig'), path: '/system/config', color: '#fa8c16' },
              { label: 'Manage LinkSys', path: '/system/linksys', color: '#52c41a' },
              { label: 'Manage ACME', path: '/system/acme', color: '#eb2f96' },
            ].map((link) => (
              <Button key={link.path} type="link" onClick={() => navigate(link.path)}
                style={{ display: 'block', textAlign: 'left', padding: '4px 0', color: link.color }}>
                → {link.label}
              </Button>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="ReferenceGrant" size="small" bodyStyle={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
              <span style={{ color: '#888' }}>ReferenceGrant</span>
              <ResourceCountCell kind="referencegrant" />
              <Button size="small" type="link" onClick={() => navigate('/infrastructure/referencegrants')}
                style={{ padding: 0, marginLeft: 'auto' }}>
                → Manage
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
