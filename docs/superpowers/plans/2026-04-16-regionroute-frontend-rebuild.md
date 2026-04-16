# RegionRoute Frontend Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the RegionRoute management pages to use the new backend APIs (`*-region-routes` replacing `*-region-pms`), supporting both Center and Controller modes.

**Architecture:** New API layer with mode-aware endpoint selection, 4 independent page components (Center/Controller x Cluster/Service), old pages and API methods deleted. Data now arrives in a single API call instead of the old two-step proxy architecture.

**Tech Stack:** React 18, TypeScript, Ant Design 5, React Query 5, Axios

**Design spec:** `docs/superpowers/specs/2026-04-16-regionroute-frontend-rebuild-design.md`

---

### Task 1: Create API Layer — `src/api/regionRoute.ts`

**Files:**
- Create: `src/api/regionRoute.ts`

- [ ] **Step 1: Create the API file with types and functions**

Create `src/api/regionRoute.ts`:

```typescript
import { apiClient } from './client'
import { getAppMode } from '@/utils/proxy'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegionDef {
  name: string
  hashRange: [number, number]
  backendEndpoint: string
  tls: boolean
  failoverTo?: string
}

export interface HashCalcConfig {
  algorithm: string
  modulo: number
}

/** ClusterRegionRoute Entry — per-controller data */
export interface ClusterRegionRouteEntry {
  pmNamespace: string
  pmName: string
  myRegion: string
  regions: RegionDef[]
  keyGet: unknown[]
  hashKeyGet?: unknown[]
  hashCalc?: HashCalcConfig
  routeRules: unknown[]
  routeByKeyConfMatch?: { matchMap: Record<string, string> } | null
}

/** Center aggregated ClusterRegionRoute */
export interface CenterClusterRegionRoute {
  namespace: string
  name: string
  controllers: Record<string, ClusterRegionRouteEntry>
}

/** ServiceRegionRoute Entry — per-controller data */
export interface ServiceRegionRouteEntry {
  pmNamespace: string
  pmName: string
  clusterPmRef: { namespace: string; name: string }
  regions: Array<{ name: string; failoverTo?: string }>
  refPlugins: string[]
}

/** Center aggregated ServiceRegionRoute */
export interface CenterServiceRegionRoute {
  namespace: string
  name: string
  clusterRef: { namespace: string; name: string }
  controllers: Record<string, ServiceRegionRouteEntry>
}

/** Consistency check result */
export interface ConsistencyConflict {
  field: string
  values: Record<string, string>
}

export interface ConsistencyResult {
  namespace: string
  name: string
  consistent: boolean
  controllerCount: number
  conflicts: ConsistencyConflict[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prefix(): string {
  return getAppMode() === 'center' ? 'center/' : ''
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const regionRouteApi = {
  listClusterRegionRoutes: async (): Promise<{ success: boolean; data: CenterClusterRegionRoute[] | ClusterRegionRouteEntry[] }> => {
    const { data } = await apiClient.get(`${prefix()}cluster-region-routes`)
    return data
  },

  listServiceRegionRoutes: async (): Promise<{ success: boolean; data: CenterServiceRegionRoute[] | ServiceRegionRouteEntry[] }> => {
    const { data } = await apiClient.get(`${prefix()}service-region-routes`)
    return data
  },

  clusterRegionRouteFailover: async (
    namespace: string, name: string, regionName: string, failoverTo: string,
  ): Promise<{ success: boolean; data?: { modified: number; failed: number } }> => {
    const { data } = await apiClient.post(`${prefix()}cluster-region-routes/failover`, {
      namespace, name, regionName, failoverTo,
    })
    return data
  },

  serviceRegionRouteFailover: async (
    namespace: string, name: string, regionName: string, failoverTo: string,
  ): Promise<{ success: boolean; data?: { modified: number; failed: number } }> => {
    const { data } = await apiClient.post(`${prefix()}service-region-routes/failover`, {
      namespace, name, regionName, failoverTo,
    })
    return data
  },

  // Center-only
  clusterRegionRoutesConsistency: async (): Promise<{ success: boolean; data: ConsistencyResult[] }> => {
    const { data } = await apiClient.get('center/cluster-region-routes/consistency')
    return data
  },

  serviceRegionRoutesConsistency: async (): Promise<{ success: boolean; data: ConsistencyResult[] }> => {
    const { data } = await apiClient.get('center/service-region-routes/consistency')
    return data
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors from `regionRoute.ts`

- [ ] **Step 3: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add src/api/regionRoute.ts
git commit -m "feat: add regionRoute API layer with mode-aware endpoints"
```

---

### Task 2: Update i18n Keys

**Files:**
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/zh.ts`

- [ ] **Step 1: Add new i18n keys and remove obsolete ones in `en.ts`**

Add these keys after the existing `center.regionRoute.*` block (around line 486):

```typescript
  'center.regionRoute.consistent': 'Consistent',
  'center.regionRoute.inconsistent': 'Inconsistent',
  'center.regionRoute.consistencyDetail': 'Consistency Detail',
```

Add these keys in the `nav.*` section (around line 12):

```typescript
  'nav.regionRoutes': 'RegionRoute',
  'nav.regionRouteCluster': 'Cluster',
  'nav.regionRouteService': 'Service',
```

Remove these keys from `en.ts`:

```typescript
  'center.regionRoute.syncPanel': ...,
  'center.regionRoute.syncHint': ...,
  'center.regionRoute.syncToAll': ...,
  'center.regionRoute.syncOk': ...,
  'center.regionRoute.syncFail': ...,
  'center.regionRoute.syncBtn': ...,
```

- [ ] **Step 2: Apply same changes in `zh.ts`**

Add these keys after the existing `center.regionRoute.*` block:

```typescript
  'center.regionRoute.consistent': '一致',
  'center.regionRoute.inconsistent': '不一致',
  'center.regionRoute.consistencyDetail': '一致性详情',
```

Add these keys in the `nav.*` section:

```typescript
  'nav.regionRoutes': 'RegionRoute',
  'nav.regionRouteCluster': 'Cluster',
  'nav.regionRouteService': 'Service',
```

Remove the same 6 `sync*` keys from `zh.ts`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add src/i18n/en.ts src/i18n/zh.ts
git commit -m "i18n: add consistency keys, nav keys, remove sync keys"
```

---

### Task 3: Center — ClusterRegionRouteList Page

**Files:**
- Create: `src/pages/RegionRoute/ClusterRegionRouteList.tsx`

This is the largest page. It includes:
- Main table with Name, Controllers, Regions, Consistency, Actions columns
- Expanded row with per-controller Collapse panels
- Consistency conflict Alert in expanded rows
- Failover Popover with 2-second refresh delay

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/caohao/ws2/edgion-dashboard/src/pages/RegionRoute
```

- [ ] **Step 2: Create ClusterRegionRouteList.tsx**

Create `src/pages/RegionRoute/ClusterRegionRouteList.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Space, Tag, Typography, Spin, Empty, Button,
  Collapse, Alert, Tooltip, Select, Popover, AutoComplete, message,
} from 'antd'
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import {
  regionRouteApi,
  type CenterClusterRegionRoute,
  type ClusterRegionRouteEntry,
  type RegionDef,
  type ConsistencyResult,
} from '@/api/regionRoute'
import { useT } from '@/i18n'

const { Text } = Typography

// ---------------------------------------------------------------------------
// RegionsCell — vertical region tags from first controller
// ---------------------------------------------------------------------------

function RegionsCell({ item }: { item: CenterClusterRegionRoute }) {
  const entries = Object.values(item.controllers)
  if (entries.length === 0) return <Text type="secondary">—</Text>
  const regions = entries[0].regions
  return (
    <Space direction="vertical" size={4}>
      {regions.map((r) => (
        <Tooltip key={r.name} title={`[${r.hashRange[0]}, ${r.hashRange[1]}]`}>
          <Tag color={r.failoverTo ? 'orange' : 'green'}>
            {r.name}{r.failoverTo ? ` → ${r.failoverTo}` : ''}
          </Tag>
        </Tooltip>
      ))}
    </Space>
  )
}

// ---------------------------------------------------------------------------
// ConsistencyTag — green/red tag with conflict popover
// ---------------------------------------------------------------------------

function ConsistencyTag({ result }: { result?: ConsistencyResult }) {
  const t = useT()
  if (!result) return <Text type="secondary">—</Text>
  if (result.consistent) return <Tag color="green">{t('center.regionRoute.consistent')}</Tag>

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
      <Tag color="red" style={{ cursor: 'pointer' }}>
        {t('center.regionRoute.inconsistent')}
      </Tag>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// FailoverPanel
// ---------------------------------------------------------------------------

function buildFailoverOptions(regions: RegionDef[], currentName: string, t: (key: string) => string) {
  return [
    { value: '', label: <Text type="secondary">{t('center.regionRoute.failoverNone')}</Text> },
    ...regions.filter((r) => r.name !== currentName).map((r) => ({ value: r.name, label: r.name })),
  ]
}

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
    },
    onSuccess: () => {
      message.success(t('center.regionRoute.failoverUpdateOk'))
      onDone?.()
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['center-cluster-region-routes'] })
        queryClient.invalidateQueries({ queryKey: ['center-cluster-consistency'] })
      }, 2000)
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
              options={buildFailoverOptions(regions, region.name, t)}
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

function RowActions({ item }: { item: CenterClusterRegionRoute }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const entries = Object.values(item.controllers)
  const regions = entries[0]?.regions ?? []

  return (
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
  )
}

// ---------------------------------------------------------------------------
// ExpandedDetail
// ---------------------------------------------------------------------------

function ExpandedDetail({
  item,
  consistencyResult,
}: {
  item: CenterClusterRegionRoute
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
                {entry.myRegion && <Tag color="green">{t('center.regionRoute.myRegion')}: {entry.myRegion}</Tag>}
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

export default function ClusterRegionRouteList() {
  const t = useT()
  const [filter, setFilter] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['center-cluster-region-routes'],
    queryFn: () => regionRouteApi.listClusterRegionRoutes(),
    staleTime: 30_000,
  })

  const { data: consistencyData } = useQuery({
    queryKey: ['center-cluster-consistency'],
    queryFn: () => regionRouteApi.clusterRegionRoutesConsistency(),
    staleTime: 30_000,
  })

  const allItems = useMemo(() => (data?.data ?? []) as CenterClusterRegionRoute[], [data])
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
      title: t('center.clusterRoute.name'),
      key: 'name',
      render: (_: unknown, r: CenterClusterRegionRoute) => <Text strong>{r.namespace}/{r.name}</Text>,
    },
    {
      title: t('center.regionRoute.controllers'),
      key: 'controllers',
      render: (_: unknown, r: CenterClusterRegionRoute) => <Tag color="blue">{Object.keys(r.controllers).length}</Tag>,
    },
    {
      title: t('center.regionRoute.regions'),
      key: 'regions',
      render: (_: unknown, r: CenterClusterRegionRoute) => <RegionsCell item={r} />,
    },
    {
      title: t('center.regionRoute.consistent'),
      key: 'consistency',
      render: (_: unknown, r: CenterClusterRegionRoute) => (
        <ConsistencyTag result={consistencyMap.get(`${r.namespace}/${r.name}`)} />
      ),
    },
    {
      title: t('center.regionRoute.failoverBtn'),
      key: 'actions',
      render: (_: unknown, r: CenterClusterRegionRoute) => <RowActions item={r} />,
    },
  ], [t, consistencyMap])

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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add src/pages/RegionRoute/ClusterRegionRouteList.tsx
git commit -m "feat: add Center ClusterRegionRouteList page"
```

---

### Task 4: Center — ServiceRegionRouteList Page

**Files:**
- Create: `src/pages/RegionRoute/ServiceRegionRouteList.tsx`

- [ ] **Step 1: Create ServiceRegionRouteList.tsx**

Create `src/pages/RegionRoute/ServiceRegionRouteList.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Space, Tag, Typography, Spin, Empty, Button,
  Collapse, Alert, Tooltip, Select, Popover, AutoComplete, message,
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
  if (!result) return <Text type="secondary">—</Text>
  if (result.consistent) return <Tag color="green">{t('center.regionRoute.consistent')}</Tag>

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
      <Tag color="red" style={{ cursor: 'pointer' }}>
        {t('center.regionRoute.inconsistent')}
      </Tag>
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
    },
    onSuccess: () => {
      message.success(t('center.regionRoute.failoverUpdateOk'))
      onDone?.()
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['center-service-region-routes'] })
        queryClient.invalidateQueries({ queryKey: ['center-service-consistency'] })
      }, 2000)
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

function RowActions({ item }: { item: CenterServiceRegionRoute }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const entries = Object.values(item.controllers)
  const regions = entries[0]?.regions ?? []

  return (
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
      title: t('center.regionRoute.pmName'),
      key: 'name',
      render: (_: unknown, r: CenterServiceRegionRoute) => <Text strong>{r.namespace}/{r.name}</Text>,
    },
    {
      title: 'Cluster Ref',
      key: 'clusterRef',
      render: (_: unknown, r: CenterServiceRegionRoute) => (
        <Text>{r.clusterRef.namespace}/{r.clusterRef.name}</Text>
      ),
    },
    {
      title: t('center.regionRoute.controllers'),
      key: 'controllers',
      render: (_: unknown, r: CenterServiceRegionRoute) => <Tag color="blue">{Object.keys(r.controllers).length}</Tag>,
    },
    {
      title: t('center.regionRoute.regions'),
      key: 'regions',
      render: (_: unknown, r: CenterServiceRegionRoute) => <RegionsCell item={r} />,
    },
    {
      title: t('center.regionRoute.consistent'),
      key: 'consistency',
      render: (_: unknown, r: CenterServiceRegionRoute) => (
        <ConsistencyTag result={consistencyMap.get(`${r.namespace}/${r.name}`)} />
      ),
    },
    {
      title: t('center.regionRoute.failoverBtn'),
      key: 'actions',
      render: (_: unknown, r: CenterServiceRegionRoute) => <RowActions item={r} />,
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add src/pages/RegionRoute/ServiceRegionRouteList.tsx
git commit -m "feat: add Center ServiceRegionRouteList page"
```

---

### Task 5: Controller — ControllerClusterRegionRouteList Page

**Files:**
- Create: `src/pages/RegionRoute/ControllerClusterRegionRouteList.tsx`

- [ ] **Step 1: Create ControllerClusterRegionRouteList.tsx**

Create `src/pages/RegionRoute/ControllerClusterRegionRouteList.tsx`:

```tsx
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
    },
    onSuccess: () => {
      message.success(t('center.regionRoute.failoverUpdateOk'))
      onDone?.()
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['controller-cluster-region-routes'] })
      }, 2000)
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add src/pages/RegionRoute/ControllerClusterRegionRouteList.tsx
git commit -m "feat: add Controller ClusterRegionRouteList page"
```

---

### Task 6: Controller — ControllerServiceRegionRouteList Page

**Files:**
- Create: `src/pages/RegionRoute/ControllerServiceRegionRouteList.tsx`

- [ ] **Step 1: Create ControllerServiceRegionRouteList.tsx**

Create `src/pages/RegionRoute/ControllerServiceRegionRouteList.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Space, Tag, Typography, Spin, Empty, Button,
  Select, Popover, AutoComplete, message,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import {
  regionRouteApi,
  type ServiceRegionRouteEntry,
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
    },
    onSuccess: () => {
      message.success(t('center.regionRoute.failoverUpdateOk'))
      onDone?.()
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['controller-service-region-routes'] })
      }, 2000)
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

function RowActions({ entry }: { entry: ServiceRegionRouteEntry }) {
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
// ExpandedDetail
// ---------------------------------------------------------------------------

function ExpandedDetail({ entry }: { entry: ServiceRegionRouteEntry }) {
  const t = useT()
  return (
    <Space direction="vertical" style={{ width: '100%', padding: '8px 0' }} size={12}>
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
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ControllerServiceRegionRouteList() {
  const t = useT()
  const [filter, setFilter] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['controller-service-region-routes'],
    queryFn: () => regionRouteApi.listServiceRegionRoutes(),
    staleTime: 30_000,
  })

  const allItems = useMemo(() => (data?.data ?? []) as ServiceRegionRouteEntry[], [data])

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
      title: t('center.regionRoute.pmName'),
      key: 'name',
      render: (_: unknown, r: ServiceRegionRouteEntry) => <Text strong>{r.pmNamespace}/{r.pmName}</Text>,
    },
    {
      title: 'Cluster Ref',
      key: 'clusterRef',
      render: (_: unknown, r: ServiceRegionRouteEntry) => (
        <Text>{r.clusterPmRef.namespace}/{r.clusterPmRef.name}</Text>
      ),
    },
    {
      title: t('center.regionRoute.regions'),
      key: 'regions',
      render: (_: unknown, r: ServiceRegionRouteEntry) => (
        <Space direction="vertical" size={4}>
          {r.regions.map((region) => (
            <Tag key={region.name} color={region.failoverTo ? 'orange' : 'green'}>
              {region.name}{region.failoverTo ? ` → ${region.failoverTo}` : ''}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('center.regionRoute.failoverBtn'),
      key: 'actions',
      render: (_: unknown, r: ServiceRegionRouteEntry) => <RowActions entry={r} />,
    },
  ], [t])

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add src/pages/RegionRoute/ControllerServiceRegionRouteList.tsx
git commit -m "feat: add Controller ServiceRegionRouteList page"
```

---

### Task 7: Routing & Navigation

**Files:**
- Modify: `src/App.tsx:1-154`
- Modify: `src/components/Layout/MainLayout.tsx:1-18` (imports), `37-131` (menu items), `162-169` (open keys)

- [ ] **Step 1: Update App.tsx imports and routes**

In `src/App.tsx`, replace the old imports (lines 14-15):

```diff
-import ClusterRegionRoutePage from './pages/Center/ClusterRegionRoutePage'
-import RegionRoutePage from './pages/Center/RegionRoutePage'
+import ClusterRegionRouteList from './pages/RegionRoute/ClusterRegionRouteList'
+import ServiceRegionRouteList from './pages/RegionRoute/ServiceRegionRouteList'
+import ControllerClusterRegionRouteList from './pages/RegionRoute/ControllerClusterRegionRouteList'
+import ControllerServiceRegionRouteList from './pages/RegionRoute/ControllerServiceRegionRouteList'
```

Replace the Center mode route elements (lines 91-92):

```diff
-          <Route path="region-routes/cluster" element={<ClusterRegionRoutePage />} />
-          <Route path="region-routes/service" element={<RegionRoutePage />} />
+          <Route path="region-routes/cluster" element={<ClusterRegionRouteList />} />
+          <Route path="region-routes/service" element={<ServiceRegionRouteList />} />
```

Add Controller-mode RegionRoute routes under the MainLayout routes (after line 145, before the closing `</Route>`):

```tsx
        <Route path="region-routes/cluster" element={<ControllerClusterRegionRouteList />} />
        <Route path="region-routes/service" element={<ControllerServiceRegionRouteList />} />
```

Also add under the ControllerProxy routes (after line 117, before the closing `</Route>`):

```tsx
          <Route path="region-routes/cluster" element={<ControllerClusterRegionRouteList />} />
          <Route path="region-routes/service" element={<ControllerServiceRegionRouteList />} />
```

- [ ] **Step 2: Update MainLayout.tsx sidebar**

In `src/components/Layout/MainLayout.tsx`, add `ShareAltOutlined` to imports (already imported, no change needed — verify it's on line 15).

Add the RegionRoute menu item in the Ops group, after the ACME entry (after line 128, before the closing `]` of the Ops children array):

```typescript
        {
          key: 'region-routes',
          icon: <ShareAltOutlined />,
          label: t('nav.regionRoutes'),
          children: [
            { key: '/region-routes/cluster', label: t('nav.regionRouteCluster') },
            { key: '/region-routes/service', label: t('nav.regionRouteService') },
          ],
        },
```

Update `getOpenKeys()` (around line 168) to add:

```typescript
    if (effectivePath.startsWith('/region-routes')) return ['region-routes']
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add src/App.tsx src/components/Layout/MainLayout.tsx
git commit -m "feat: register RegionRoute routes and add sidebar navigation"
```

---

### Task 8: Cleanup — Delete Old Pages and API Methods

**Files:**
- Delete: `src/pages/Center/ClusterRegionRoutePage.tsx`
- Delete: `src/pages/Center/RegionRoutePage.tsx`
- Modify: `src/api/center.ts:46-80` (remove old types), `101-139` (remove old methods)

- [ ] **Step 1: Delete old page files**

```bash
cd /Users/caohao/ws2/edgion-dashboard
rm src/pages/Center/ClusterRegionRoutePage.tsx
rm src/pages/Center/RegionRoutePage.tsx
```

- [ ] **Step 2: Remove old types from center.ts**

Remove these type definitions from `src/api/center.ts` (lines 24-80):

- `RegionDef` interface
- `HashCalcConfig` interface
- `RegionPmSummary` interface
- `ClusterRegionPmDetail` interface
- `ServiceRegionPmDetail` interface
- `ControllerClusterPm` interface

- [ ] **Step 3: Remove old methods from center.ts**

Remove these methods from the `centerApi` object in `src/api/center.ts` (lines 101-139):

- `listClusterRegionPms`
- `listServiceRegionPms`
- `clusterPmFailover`
- `servicePmFailover`
- `proxyListClusterPms`
- `proxyListServicePms`

Also remove the `// ── RegionRoute PluginMetaData (new) ───` comment section header.

The remaining `centerApi` object should only have: `listControllers`, `listClusters`, `reloadController`, and the Admin methods.

- [ ] **Step 4: Verify TypeScript compiles and no dangling imports**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors. If there are import errors in other files referencing old types, fix them.

- [ ] **Step 5: Commit**

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add -A
git commit -m "refactor: remove old RegionRoute pages and API methods"
```

---

### Task 9: Build Verification

- [ ] **Step 1: Full TypeScript check**

Run: `cd /Users/caohao/ws2/edgion-dashboard && ./node_modules/.bin/tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Production build**

Run: `cd /Users/caohao/ws2/edgion-dashboard && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Fix any issues found and commit**

If build fails, fix the issues and commit:

```bash
cd /Users/caohao/ws2/edgion-dashboard
git add -A
git commit -m "fix: resolve build issues"
```

---

### Task 10: Start Test Environment for Manual Verification

This task prepares the Center/Controller test environment for the user to manually test the UI.

- [ ] **Step 1: Build backend Docker image**

```bash
cd /Users/caohao/ws2/Edgion
docker buildx use orbstack
docker buildx build --load -t edgion-all:local -f docker/Dockerfile.allbin .
```

- [ ] **Step 2: Deploy to OrbStack K8s**

Follow `ws2/skills/05-center-testing/SKILL.md` deployment steps. The pods should be deployed in `edgion-test` namespace.

- [ ] **Step 3: Start port-forward for Center**

```bash
kubectl -n edgion-test port-forward pod/center 5810:5810
```

- [ ] **Step 4: Start frontend dev server**

```bash
cd /Users/caohao/ws2/edgion-dashboard && npm run dev
```

- [ ] **Step 5: Report URLs to user**

Report:
- Frontend: `http://localhost:5173`
- Login: `admin / edgion1234`
- Pages to test:
  - Center cluster: `/region-routes/cluster`
  - Center service: `/region-routes/service`
  - Controller drill-down: click a controller, then navigate to RegionRoute
