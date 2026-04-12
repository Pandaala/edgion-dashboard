import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  Input,
  Space,
  Tag,
  Badge,
  Button,
  Collapse,
  Typography,
  Spin,
  Empty,
  Alert,
} from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import {
  centerApi,
  type CenterRegionRouteKey,
  type CenterRegionRouteDetail,
  type CenterRegionRouteDetailEntry,
  type RegionDef,
} from '@/api/center'
import { useT } from '@/i18n'

const { Text } = Typography

function RegionDefsTable({ regions }: { regions: RegionDef[] }) {
  const t = useT()
  return (
    <Table
      size="small"
      pagination={false}
      dataSource={regions.map((r, i) => ({ ...r, key: i }))}
      columns={[
        {
          title: t('center.regionRoute.regionName'),
          dataIndex: 'name',
          render: (v: string) => <Text strong>{v}</Text>,
        },
        {
          title: t('center.regionRoute.hashRange'),
          dataIndex: 'hashRange',
          render: (v: [number, number]) => (
            <Tag color="blue">[{v[0]}, {v[1]}]</Tag>
          ),
        },
        {
          title: t('center.regionRoute.endpoint'),
          dataIndex: 'backendEndpoint',
          render: (v: string) => <Text code>{v}</Text>,
        },
        {
          title: t('center.regionRoute.tls'),
          dataIndex: 'tls',
          render: (v: boolean) => (
            <Tag color={v ? 'green' : 'default'}>{v ? 'TLS' : t('center.regionRoute.tlsPlain')}</Tag>
          ),
        },
        {
          title: t('center.regionRoute.failover'),
          dataIndex: 'failoverTo',
          render: (v?: string) =>
            v ? <Tag color="orange">{v}</Tag> : <Text type="secondary">—</Text>,
        },
      ]}
    />
  )
}

function SectionLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  )
}

function RouteRulesDisplay({ rules }: { rules: unknown[] }) {
  if (rules.length === 0) {
    return <Text type="secondary">—</Text>
  }
  return (
    <Space wrap>
      {rules.map((rule, i) => {
        const r = rule as Record<string, unknown>
        return <Tag key={i} color="purple">{String(r.type ?? '?')}</Tag>
      })}
    </Space>
  )
}

function DetailEntryCard({ entry }: { entry: CenterRegionRouteDetailEntry }) {
  const t = useT()
  const regions = entry.baseInfo?.regions ?? []

  return (
    <Collapse
      size="small"
      style={{ marginBottom: 8 }}
      items={[
        {
          key: 'main',
          label: (
            <Space wrap>
              <Text strong>{entry.kind} / {entry.name}</Text>
              {entry.baseInfo?.myRegion && (
                <Tag color="green">{t('center.regionRoute.myRegion')}: {entry.baseInfo.myRegion}</Tag>
              )}
              <Tag color="blue">{regions.length} {t('center.regionRoute.regions')}</Tag>
              {entry.httpRoutes.length > 0 && (
                <Space size={4}>
                  {entry.httpRoutes.map((r) => (
                    <Tag key={r} color="cyan">HTTPRoute: {r}</Tag>
                  ))}
                </Space>
              )}
            </Space>
          ),
          children: (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <SectionLabel label={t('center.regionRoute.regions')}>
                <RegionDefsTable regions={regions} />
              </SectionLabel>
              {entry.routeRules.length > 0 && (
                <SectionLabel label={t('center.regionRoute.routeRules')}>
                  <RouteRulesDisplay rules={entry.routeRules} />
                </SectionLabel>
              )}
              {entry.hashCalc && (
                <SectionLabel label={t('center.regionRoute.hashCalc')}>
                  <Space>
                    <Tag>{t('center.regionRoute.algorithm')}: {entry.hashCalc.algorithm}</Tag>
                    <Tag>{t('center.regionRoute.modulo')}: {entry.hashCalc.modulo}</Tag>
                  </Space>
                </SectionLabel>
              )}
            </Space>
          ),
        },
      ]}
    />
  )
}

function ExpandedDetail({
  serviceGroup,
  cluster,
  namespace,
  kind,
}: {
  serviceGroup: string
  cluster: string
  namespace: string
  kind: string
}) {
  const t = useT()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['center-region-route-detail', serviceGroup, cluster, namespace, kind],
    queryFn: () => centerApi.getRegionRouteDetail(serviceGroup, cluster, namespace, kind),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 }}>
        <Spin size="small" />
        <Text type="secondary">{t('center.regionRoute.loadingDetail')}</Text>
      </div>
    )
  }

  if (isError || !data?.data) {
    return (
      <Alert
        type="error"
        message={t('center.regionRoute.fetchError', { id: `${serviceGroup}/${cluster}/${namespace}/${kind}` })}
        showIcon
      />
    )
  }

  const details: CenterRegionRouteDetail[] = data.data

  if (details.length === 0) {
    return <Empty description={t('center.regionRoute.noData')} />
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {details.map((ctrl) => (
        <div key={ctrl.controllerId} style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            {t('center.regionRoute.controller')}: {ctrl.controllerId}
          </Text>
          {ctrl.entries.map((entry, i) => (
            <DetailEntryCard
              key={`${ctrl.controllerId}-${entry.name}-${i}`}
              entry={entry}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function RegionRoutePage() {
  const t = useT()

  const [serviceGroup, setServiceGroup] = useState('')
  const [cluster, setCluster] = useState('')
  const [namespace, setNamespace] = useState('')
  const [kind, setKind] = useState('')

  const [searchParams, setSearchParams] = useState<{
    serviceGroup?: string
    cluster?: string
    namespace?: string
    kind?: string
  }>({})

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['center-region-routes', searchParams],
    queryFn: () => centerApi.listRegionRoutes(searchParams),
    staleTime: 30 * 1000,
  })

  const handleSearch = () => {
    const params: typeof searchParams = {}
    if (serviceGroup.trim()) params.serviceGroup = serviceGroup.trim()
    if (cluster.trim()) params.cluster = cluster.trim()
    if (namespace.trim()) params.namespace = namespace.trim()
    if (kind.trim()) params.kind = kind.trim()
    setSearchParams(params)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const items: CenterRegionRouteKey[] = data?.data ?? []

  const totalResources = items.reduce((sum, item) => {
    return sum + item.controllers.reduce((s, c) => s + c.resources.length, 0)
  }, 0)

  const columns = [
    {
      title: t('center.regionRoute.serviceGroup'),
      dataIndex: 'serviceGroup',
      key: 'serviceGroup',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: t('center.regionRoute.cluster'),
      dataIndex: 'cluster',
      key: 'cluster',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('center.regionRoute.namespace'),
      dataIndex: 'namespace',
      key: 'namespace',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Kind',
      dataIndex: 'kind',
      key: 'kind',
      render: (v: string) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: t('center.regionRoute.controllers'),
      key: 'controllers',
      render: (_: unknown, record: CenterRegionRouteKey) => (
        <Badge count={record.controllers.length} color="green" overflowCount={99} />
      ),
    },
    {
      title: t('center.regionRoute.resourceCount'),
      key: 'resourceCount',
      render: (_: unknown, record: CenterRegionRouteKey) => {
        const count = record.controllers.reduce((s, c) => s + c.resources.length, 0)
        return <Badge count={count} color="blue" overflowCount={999} />
      },
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Space>
          <Text style={{ color: '#888', fontSize: 13 }}>
            {t('center.regionRoute.subtitle', { n: items.length })}
          </Text>
          {totalResources > 0 && (
            <Tag color="blue">
              {totalResources} {t('center.regionRoute.resourceCount')}
            </Tag>
          )}
        </Space>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('btn.refresh')}
        </Button>
      </div>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} size={8}>
        <Input
          placeholder={t('center.regionRoute.serviceGroup')}
          value={serviceGroup}
          onChange={(e) => setServiceGroup(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: 180 }}
          allowClear
        />
        <Input
          placeholder={t('center.regionRoute.cluster')}
          value={cluster}
          onChange={(e) => setCluster(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: 180 }}
          allowClear
        />
        <Input
          placeholder={t('center.regionRoute.namespace')}
          value={namespace}
          onChange={(e) => setNamespace(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: 180 }}
          allowClear
        />
        <Input
          placeholder="Kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: 180 }}
          allowClear
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          {t('action.search')}
        </Button>
      </Space>

      {isLoading ? (
        <Spin
          size="large"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
          }}
        />
      ) : items.length === 0 ? (
        <Empty description={t('center.regionRoute.noData')} />
      ) : (
        <Table
          dataSource={items}
          columns={columns}
          rowKey={(record) => `${record.serviceGroup}/${record.cluster}/${record.namespace}/${record.kind}`}
          pagination={{
            showTotal: (n) => t('table.totalItems', { n }),
          }}
          expandable={{
            expandedRowRender: (record) => (
              <ExpandedDetail
                serviceGroup={record.serviceGroup}
                cluster={record.cluster}
                namespace={record.namespace}
                kind={record.kind}
              />
            ),
          }}
        />
      )}
    </div>
  )
}
