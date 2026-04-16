import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Space, Tag, Typography, Spin, Empty, Button,
  Collapse, Alert, Popover, AutoComplete, message, Select,
} from 'antd'
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import {
  regionRouteApi,
  type CenterServiceRegionRoute,
  type ConsistencyResult,
} from '@/api/regionRoute'
import { useT } from '@/i18n'

const { Text } = Typography

// ---------------------------------------------------------------------------
// RegionsCell
// ---------------------------------------------------------------------------

function RegionsCell({ item }: { item: CenterServiceRegionRoute }) {
  const entries = Object.values(item.controllers)
  if (entries.length === 0) return <Text type="secondary">—</Text>
  const regions = entries[0].regions
  return (
    <Space direction="vertical" size={4}>
      {regions.map((r) => (
        <Tag key={r.name} color={r.failoverTo ? 'orange' : 'green'}>
          {r.name}{r.failoverTo ? ` → ${r.failoverTo}` : ''}
        </Tag>
      ))}
    </Space>
  )
}

// ---------------------------------------------------------------------------
// ConsistencyTag
// ---------------------------------------------------------------------------

function ConsistencyTag({ result }: { result?: ConsistencyResult }) {
  const t = useT()
  if (!result || result.consistent) return null

  const content = (
    <div style={{ maxWidth: 400 }}>
      {result.conflicts.map((c, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <Text strong>{c.field}</Text>
          {Object.entries(c.values).map(([ctrl, val]) => (
            <div key={ctrl} style={{ paddingLeft: 12, fontSize: 12 }}>
              {ctrl}: <Text code>{val}</Text>
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <Popover title={t('center.regionRoute.consistencyDetail')} content={content} trigger="click">
      <span style={{ fontSize: 18, cursor: 'pointer' }}>⚠️</span>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// FailoverPanel — uses service failover endpoint
// ---------------------------------------------------------------------------

function FailoverPanel({
  regions,
  namespace,
  name,
  onDone,
}: {
  regions: Array<{ name: string; failoverTo?: string }>
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

  const allRegionNames = regions.map((r) => r.name)

  const applyMutation = useMutation({
    mutationFn: async () => {
      const changed = regions.filter((r) => (r.failoverTo ?? '') !== (pending[r.name] ?? ''))
      await Promise.all(
        changed.map((region) =>
          regionRouteApi.serviceRegionRouteFailover(namespace, name, region.name, pending[region.name] ?? ''),
        ),
      )
      await new Promise((r) => setTimeout(r, 2000))
    },
    onSuccess: () => {
      message.success(t('center.regionRoute.failoverUpdateOk'))
      queryClient.invalidateQueries({ queryKey: ['center-service-region-routes'] })
      queryClient.invalidateQueries({ queryKey: ['center-service-consistency'] })
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
            <Select
              size="small"
              value={pending[region.name] ?? ''}
              disabled={applyMutation.isPending}
              onChange={(v) => setPending((prev) => ({ ...prev, [region.name]: v }))}
              style={{ width: 180 }}
              options={[
                { value: '', label: <Text type="secondary">{t('center.regionRoute.failoverNone')}</Text> },
                ...allRegionNames.filter((n) => n !== region.name).map((n) => ({ value: n, label: n })),
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

function RowActions({ item, consistencyResult }: { item: CenterServiceRegionRoute; consistencyResult?: ConsistencyResult }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const entries = Object.values(item.controllers)
  const regions = entries[0]?.regions ?? []

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger="click"
        title={t('center.regionRoute.failoverPanel')}
        content={
          <div style={{ minWidth: 380, maxWidth: 500 }}>
            {regions.length === 0 ? (
              <Empty description={t('center.regionRoute.noData')} imageStyle={{ height: 40 }} />
            ) : (
              <FailoverPanel
                regions={regions}
                namespace={item.namespace}
                name={item.name}
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
      {consistencyResult && !consistencyResult.consistent && (
        <ConsistencyTag result={consistencyResult} />
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ExpandedDetail
// ---------------------------------------------------------------------------

function ExpandedDetail({
  item,
  consistencyResult,
}: {
  item: CenterServiceRegionRoute
  consistencyResult?: ConsistencyResult
}) {
  const t = useT()
  const controllerEntries = Object.entries(item.controllers)

  if (controllerEntries.length === 0) return <Empty description={t('center.regionRoute.noData')} />

  return (
    <div style={{ padding: '8px 0' }}>
      {consistencyResult && !consistencyResult.consistent && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 12 }}
          message={t('center.regionRoute.conflictAlert')}
          description={
            <div style={{ marginTop: 4 }}>
              {consistencyResult.conflicts.map((c, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <Text strong>{c.field}</Text>
                  {Object.entries(c.values).map(([ctrl, val]) => (
                    <div key={ctrl} style={{ paddingLeft: 12, fontSize: 12 }}>
                      {ctrl}: <Text code>{val}</Text>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          }
        />
      )}
      {controllerEntries.map(([controllerId, entry]) => (
        <Collapse
          key={controllerId}
          size="small"
          style={{ marginBottom: 8 }}
          items={[{
            key: 'main',
            label: (
              <Space>
                <Text strong>{controllerId}</Text>
                <Tag color="blue">{entry.regions.length} {t('center.regionRoute.regions')}</Tag>
              </Space>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={entry.regions.map((r, i) => ({ ...r, key: i }))}
                  columns={[
                    { title: t('center.regionRoute.regionName'), dataIndex: 'name', render: (v: string) => <Text strong>{v}</Text> },
                    { title: t('center.regionRoute.failover'), dataIndex: 'failoverTo', render: (v: string | undefined) => v ? <Tag color="orange">{v}</Tag> : <Text type="secondary">—</Text> },
                  ]}
                />
                {entry.refPlugins.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Ref Plugins</Text>
                    <div style={{ marginTop: 4 }}>
                      <Space wrap>{entry.refPlugins.map((p, i) => <Tag key={i} color="purple">{p}</Tag>)}</Space>
                    </div>
                  </div>
                )}
              </Space>
            ),
          }]}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ServiceRegionRouteList() {
  const t = useT()
  const [filter, setFilter] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['center-service-region-routes'],
    queryFn: () => regionRouteApi.listServiceRegionRoutes(),
    staleTime: 30_000,
  })

  const { data: consistencyData } = useQuery({
    queryKey: ['center-service-consistency'],
    queryFn: () => regionRouteApi.serviceRegionRoutesConsistency(),
    staleTime: 30_000,
  })

  const allItems = useMemo(() => (data?.data ?? []) as CenterServiceRegionRoute[], [data])
  const consistencyMap = useMemo(() => {
    const map = new Map<string, ConsistencyResult>()
    for (const r of consistencyData?.data ?? []) {
      map.set(`${r.namespace}/${r.name}`, r)
    }
    return map
  }, [consistencyData])

  const filteredItems = useMemo(() => {
    if (!filter) return allItems
    const lf = filter.toLowerCase()
    return allItems.filter((item) => `${item.namespace}/${item.name}`.toLowerCase().includes(lf))
  }, [allItems, filter])

  const filterOptions = useMemo(
    () => [...new Set(allItems.map((i) => `${i.namespace}/${i.name}`))]
      .filter((v) => !filter || v.toLowerCase().includes(filter.toLowerCase()))
      .map((v) => ({ value: v })),
    [allItems, filter],
  )

  const columns = useMemo(() => [
    {
      title: <>Service <span style={{ fontSize: 11, color: '#999', fontWeight: 'normal' }}>(Namespace/Name)</span></>,
      key: 'name',
      render: (_: unknown, r: CenterServiceRegionRoute) => <Text strong>{r.namespace}/{r.name}</Text>,
    },
    {
      title: <>Cluster <span style={{ fontSize: 11, color: '#999', fontWeight: 'normal' }}>(Namespace/Name)</span></>,
      key: 'clusterRef',
      render: (_: unknown, r: CenterServiceRegionRoute) => (
        r.clusterRef ? <Text>{r.clusterRef.namespace}/{r.clusterRef.name}</Text> : <Text type="secondary">—</Text>
      ),
    },
    {
      title: t('center.regionRoute.regions'),
      key: 'regions',
      render: (_: unknown, r: CenterServiceRegionRoute) => <RegionsCell item={r} />,
    },
    {
      title: t('center.regionRoute.failoverBtn'),
      key: 'actions',
      render: (_: unknown, r: CenterServiceRegionRoute) => (
        <RowActions item={r} consistencyResult={consistencyMap.get(`${r.namespace}/${r.name}`)} />
      ),
    },
  ], [t, consistencyMap])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#888', fontSize: 13 }}>
          {t('center.regionRoute.subtitle', { n: filteredItems.length })}
        </Text>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>{t('btn.refresh')}</Button>
      </div>
      <AutoComplete
        placeholder={t('center.regionRoute.pmName')}
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
          rowKey={(r) => `${r.namespace}/${r.name}`}
          pagination={{ pageSize: 10, showTotal: (n) => t('table.totalItems', { n }) }}
          expandable={{
            expandedRowRender: (record) => (
              <ExpandedDetail
                item={record}
                consistencyResult={consistencyMap.get(`${record.namespace}/${record.name}`)}
              />
            ),
          }}
        />
      )}
    </div>
  )
}
