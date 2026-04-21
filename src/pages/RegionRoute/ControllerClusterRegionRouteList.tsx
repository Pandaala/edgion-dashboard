import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Space, Tag, Typography, Spin, Empty, Button,
  Tooltip, Select, Popover, AutoComplete, message,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import {
  regionRouteApi,
  type ClusterRegionRouteEntry,
  type RegionDef,
} from '@/api/regionRoute'
import { useT } from '@/i18n'

const { Text } = Typography

// ---------------------------------------------------------------------------
// FailoverPanel
// ---------------------------------------------------------------------------

function FailoverPanel({
  regions,
  namespace,
  name,
  onDone,
}: {
  regions: RegionDef[]
  namespace: string
  name: string
  onDone?: () => void
}) {
  const t = useT()
  const queryClient = useQueryClient()

  const [pending, setPending] = useState<Record<string, string>>(
    () => Object.fromEntries(regions.map((r) => [r.name, r.failoverTo ?? ''])),
  )

  const isDirty = regions.some((r) => (r.failoverTo ?? '') !== (pending[r.name] ?? ''))

  const applyMutation = useMutation({
    mutationFn: async () => {
      const changed = regions.filter((r) => (r.failoverTo ?? '') !== (pending[r.name] ?? ''))
      await Promise.all(
        changed.map((region) =>
          regionRouteApi.clusterRegionRouteFailover(namespace, name, region.name, pending[region.name] ?? ''),
        ),
      )
      await new Promise((r) => setTimeout(r, 2000))
    },
    onSuccess: () => {
      message.success(t('center.regionRoute.failoverUpdateOk'))
      queryClient.invalidateQueries({ queryKey: ['controller-cluster-region-routes'] })
      onDone?.()
    },
    onError: (e: any) => {
      message.error(t('center.regionRoute.failoverUpdateFail', { err: e.message }))
    },
  })

  return (
    <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '12px 16px' }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {regions.map((region) => (
          <Space key={region.name} size={8} style={{ flexWrap: 'nowrap' }}>
            <Text style={{ width: 110, display: 'inline-block' }} strong>{region.name}</Text>
            <Text type="secondary" style={{ width: 100, display: 'inline-block', fontSize: 12 }}>
              [{region.hashRange[0]}, {region.hashRange[1]}]
            </Text>
            <Select
              size="small"
              value={pending[region.name] ?? ''}
              disabled={applyMutation.isPending}
              onChange={(v) => setPending((prev) => ({ ...prev, [region.name]: v }))}
              style={{ width: 180 }}
              options={[
                { value: '', label: <Text type="secondary">{t('center.regionRoute.failoverNone')}</Text> },
                ...regions.filter((r) => r.name !== region.name).map((r) => ({ value: r.name, label: r.name })),
              ]}
            />
          </Space>
        ))}
        <Button
          type="primary"
          danger={isDirty}
          disabled={!isDirty}
          loading={applyMutation.isPending}
          onClick={() => applyMutation.mutate()}
          style={{ marginTop: 4 }}
        >
          {t('center.regionRoute.applyToAllN', { n: regions.length })}
        </Button>
      </Space>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RowActions
// ---------------------------------------------------------------------------

function RowActions({ entry }: { entry: ClusterRegionRouteEntry }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      title={t('center.regionRoute.failoverPanel')}
      content={
        <div style={{ minWidth: 380, maxWidth: 500 }}>
          {entry.regions.length === 0 ? (
            <Empty description={t('center.regionRoute.noData')} imageStyle={{ height: 40 }} />
          ) : (
            <FailoverPanel
              regions={entry.regions}
              namespace={entry.pmNamespace}
              name={entry.pmName}
              onDone={() => setOpen(false)}
            />
          )}
        </div>
      }
    >
      <Button size="small" type="primary">
        {t('center.regionRoute.failoverBtn')}
      </Button>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// ExpandedDetail — single entry, no Collapse
// ---------------------------------------------------------------------------

function ExpandedDetail({ entry }: { entry: ClusterRegionRouteEntry }) {
  const t = useT()
  return (
    <Space direction="vertical" style={{ width: '100%', padding: '8px 0' }} size={12}>
      <Table
        size="small"
        pagination={false}
        dataSource={entry.regions.map((r, i) => ({ ...r, key: i }))}
        columns={[
          { title: t('center.regionRoute.regionName'), dataIndex: 'name', render: (v: string) => <Text strong>{v}</Text> },
          { title: t('center.regionRoute.hashRange'), dataIndex: 'hashRange', render: (v: [number, number]) => <Tag color="blue">[{v[0]}, {v[1]}]</Tag> },
          { title: t('center.regionRoute.endpoint'), dataIndex: 'backendEndpoint', render: (v: string) => <Text code>{v}</Text> },
          { title: t('center.regionRoute.tls'), dataIndex: 'tls', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'TLS' : t('center.regionRoute.tlsPlain')}</Tag> },
          { title: t('center.regionRoute.failover'), dataIndex: 'failoverTo', render: (v: string | undefined) => v ? <Tag color="orange">{v}</Tag> : <Text type="secondary">—</Text> },
        ]}
      />
      {entry.routeRules.length > 0 && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('center.regionRoute.routeRules')}</Text>
          <div style={{ marginTop: 4 }}>
            <Space wrap>{entry.routeRules.map((rule, i) => <Tag key={i} color="purple">{String((rule as any).type ?? '?')}</Tag>)}</Space>
          </div>
        </div>
      )}
      {entry.hashCalc && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('center.regionRoute.hashCalc')}</Text>
          <div style={{ marginTop: 4 }}>
            <Space>
              <Tag>{t('center.regionRoute.algorithm')}: {entry.hashCalc.algorithm}</Tag>
              <Tag>{t('center.regionRoute.modulo')}: {entry.hashCalc.modulo}</Tag>
            </Space>
          </div>
        </div>
      )}
    </Space>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ControllerClusterRegionRouteList() {
  const t = useT()
  const [filter, setFilter] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['controller-cluster-region-routes'],
    queryFn: () => regionRouteApi.listClusterRegionRoutes(),
    staleTime: 30_000,
  })

  const allItems = useMemo(() => (data?.data ?? []) as ClusterRegionRouteEntry[], [data])

  const filteredItems = useMemo(() => {
    if (!filter) return allItems
    const lf = filter.toLowerCase()
    return allItems.filter((item) => `${item.pmNamespace}/${item.pmName}`.toLowerCase().includes(lf))
  }, [allItems, filter])

  const filterOptions = useMemo(
    () => [...new Set(allItems.map((i) => `${i.pmNamespace}/${i.pmName}`))]
      .filter((v) => !filter || v.toLowerCase().includes(filter.toLowerCase()))
      .map((v) => ({ value: v })),
    [allItems, filter],
  )

  const columns = useMemo(() => [
    {
      title: t('center.clusterRoute.name'),
      key: 'name',
      render: (_: unknown, r: ClusterRegionRouteEntry) => <Text strong>{r.pmNamespace}/{r.pmName}</Text>,
    },
    {
      title: t('center.regionRoute.myRegion'),
      key: 'myRegion',
      render: (_: unknown, r: ClusterRegionRouteEntry) => <Tag color="green">{r.myRegion}</Tag>,
    },
    {
      title: t('center.regionRoute.regions'),
      key: 'regions',
      render: (_: unknown, r: ClusterRegionRouteEntry) => (
        <Space direction="vertical" size={4}>
          {r.regions.map((region) => (
            <Tooltip key={region.name} title={`[${region.hashRange[0]}, ${region.hashRange[1]}]`}>
              <Tag color={region.failoverTo ? 'orange' : 'green'}>
                {region.name}{region.failoverTo ? ` → ${region.failoverTo}` : ''}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: t('center.regionRoute.failoverBtn'),
      key: 'actions',
      render: (_: unknown, r: ClusterRegionRouteEntry) => <RowActions entry={r} />,
    },
  ], [t])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#888', fontSize: 13 }}>
          {t('center.clusterRoute.subtitle', { n: filteredItems.length })}
        </Text>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
      </div>
      <AutoComplete
        placeholder={t('center.clusterRoute.name')}
        value={filter}
        onChange={setFilter}
        options={filterOptions}
        style={{ width: 300, marginBottom: 16 }}
        allowClear
      />
      {isLoading ? (
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }} />
      ) : filteredItems.length === 0 ? (
        <Empty description={t('center.regionRoute.noData')} />
      ) : (
        <Table
          dataSource={filteredItems}
          columns={columns}
          rowKey={(r) => `${r.pmNamespace}/${r.pmName}`}
          pagination={{ pageSize: 10, showTotal: (n) => t('table.totalItems', { n }) }}
          expandable={{
            expandedRowRender: (record) => <ExpandedDetail entry={record} />,
          }}
        />
      )}
    </div>
  )
}
