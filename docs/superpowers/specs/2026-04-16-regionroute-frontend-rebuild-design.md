# RegionRoute Frontend Rebuild Design

## Background

The backend has new RegionRoute APIs (renamed from `*-region-pms` to `*-region-routes`) on the `feature-04-13` branch. The new APIs return complete per-controller data in a single call, eliminating the two-step proxy architecture. This spec covers rebuilding the frontend pages to use the new APIs.

Task source: `Edgion/tasks/fed-pm-watch/08-frontend-rebuild.md`

---

## API Layer — `src/api/regionRoute.ts`

### Endpoints

Mode-aware prefix selection via `getAppMode()`:
- Center mode: `center/cluster-region-routes`, `center/service-region-routes`
- Controller mode: `cluster-region-routes`, `service-region-routes`

| Function | Method | Center Endpoint | Controller Endpoint |
|----------|--------|-----------------|---------------------|
| `listClusterRegionRoutes()` | GET | `center/cluster-region-routes` | `cluster-region-routes` |
| `listServiceRegionRoutes()` | GET | `center/service-region-routes` | `service-region-routes` |
| `clusterRegionRouteFailover(ns, name, regionName, failoverTo)` | POST | `center/cluster-region-routes/failover` | `cluster-region-routes/failover` |
| `serviceRegionRouteFailover(ns, name, regionName, failoverTo)` | POST | `center/service-region-routes/failover` | `service-region-routes/failover` |
| `clusterRegionRoutesConsistency()` | GET | `center/cluster-region-routes/consistency` | N/A (Center only) |
| `serviceRegionRoutesConsistency()` | GET | `center/service-region-routes/consistency` | N/A (Center only) |

### Type Definitions

All types defined in `src/api/regionRoute.ts`.

**Shared types (used by both modes):**

```typescript
interface RegionDef {
  name: string
  hashRange: [number, number]
  backendEndpoint: string
  tls: boolean
  failoverTo?: string
}

interface HashCalcConfig {
  algorithm: string
  modulo: number
}
```

**Center mode response types:**

```typescript
// ClusterRegionRoute Entry (per-controller)
interface ClusterRegionRouteEntry {
  pmNamespace: string
  pmName: string
  myRegion: string
  regions: RegionDef[]
  keyGet: unknown[]
  hashKeyGet?: unknown[]
  hashCalc?: HashCalcConfig
  routeRules: unknown[]
  routeByKeyConfMatch?: { matchMap: Record<string, string> }
}

// Center aggregated item
interface CenterClusterRegionRoute {
  namespace: string
  name: string
  controllers: Record<string, ClusterRegionRouteEntry>
}

// ServiceRegionRoute Entry (per-controller)
interface ServiceRegionRouteEntry {
  pmNamespace: string
  pmName: string
  clusterPmRef: { namespace: string; name: string }
  regions: Array<{ name: string; failoverTo?: string }>
  refPlugins: string[]
}

// Center aggregated item
interface CenterServiceRegionRoute {
  namespace: string
  name: string
  clusterRef: { namespace: string; name: string }
  controllers: Record<string, ServiceRegionRouteEntry>
}

// Consistency check
interface ConsistencyConflict {
  field: string
  values: Record<string, string>
}

interface ConsistencyResult {
  namespace: string
  name: string
  consistent: boolean
  controllerCount: number
  conflicts: ConsistencyConflict[]
}
```

**Controller mode response types:**

Controller GET returns `ClusterRegionRouteEntry[]` / `ServiceRegionRouteEntry[]` directly (flat arrays, not grouped by controller).

### Cleanup in `src/api/center.ts`

Delete these methods and types:
- Methods: `listClusterRegionPms`, `listServiceRegionPms`, `clusterPmFailover`, `servicePmFailover`, `proxyListClusterPms`, `proxyListServicePms`
- Types: `RegionPmSummary`, `ClusterRegionPmDetail`, `ServiceRegionPmDetail`, `ControllerClusterPm`, `RegionDef`, `HashCalcConfig`

Keep all other `centerApi` methods (controllers, clusters, admin) intact.

---

## Page Components

### File Structure

```
src/pages/RegionRoute/
  ClusterRegionRouteList.tsx                  # Center mode
  ServiceRegionRouteList.tsx                  # Center mode
  ControllerClusterRegionRouteList.tsx        # Controller mode
  ControllerServiceRegionRouteList.tsx        # Controller mode
```

### Center — `ClusterRegionRouteList.tsx`

**Data fetching:** Two parallel `useQuery` calls:
1. `listClusterRegionRoutes()` — main data
2. `clusterRegionRoutesConsistency()` — consistency data

**Table columns:**

| Column | Source | Display |
|--------|--------|---------|
| Name | `namespace/name` | Merged format |
| Controllers | `Object.keys(item.controllers).length` | Blue Tag with count |
| Regions | First controller's `entry.regions` | Vertical Tags, green=normal, orange=failover active, Tooltip shows hashRange |
| Consistency | Matched from consistency query | Green "Consistent" / Red "Conflict" Tag; Conflict Tag is clickable Popover showing conflict details |
| Actions | — | Failover button (Popover panel) |

**Filters:** Name + Namespace AutoComplete (same pattern as current pages).

**Expanded row:**
- If consistency conflicts exist: Alert at top (same style as current `conflictAlert`)
- Collapse per controller showing: myRegion Tag, regions sub-table (hashRange, endpoint, tls, failoverTo), routeRules, hashCalc

**Failover panel:** Popover with Select per region, "Apply" button calls `clusterRegionRouteFailover()`. On success: show success message, wait 2 seconds, then invalidate queries to refresh data (gives backend gRPC sync time).

### Center — `ServiceRegionRouteList.tsx`

**Data fetching:** Same parallel pattern with `listServiceRegionRoutes()` + `serviceRegionRoutesConsistency()`.

**Table columns:**

| Column | Source | Display |
|--------|--------|---------|
| Name | `namespace/name` | Merged format |
| Cluster Ref | `item.clusterRef` | `namespace/name` format |
| Controllers | `Object.keys(item.controllers).length` | Blue Tag count |
| Regions | First controller's `entry.regions` | Vertical Tags with failover arrows |
| Consistency | Matched from consistency query | Same as Cluster page |
| Actions | — | Failover button |

**Expanded row:** Collapse per controller showing regions list + refPlugins.

**Failover:** Calls `serviceRegionRouteFailover()`, same 2-second wait pattern.

### Controller — `ControllerClusterRegionRouteList.tsx`

**Data fetching:** Single `useQuery` calling `listClusterRegionRoutes()`, returns `ClusterRegionRouteEntry[]` directly.

**Table columns:**

| Column | Source | Display |
|--------|--------|---------|
| Name | `pmNamespace/pmName` | Merged format |
| My Region | `entry.myRegion` | Green Tag |
| Regions | `entry.regions` | Vertical Tags, same style as Center |
| Actions | — | Failover button (calls local endpoint) |

No Controllers column, no Consistency column.

**Expanded row:** Directly show regions sub-table (hashRange, endpoint, tls, failoverTo), routeRules, hashCalc. No Collapse wrapper needed (single entry, no controller grouping).

**Failover:** Same Popover panel, calls `clusterRegionRouteFailover()` (routes to local controller endpoint). Same 2-second wait.

### Controller — `ControllerServiceRegionRouteList.tsx`

**Table columns:**

| Column | Source | Display |
|--------|--------|---------|
| Name | `pmNamespace/pmName` | Merged format |
| Cluster Ref | `clusterPmRef` | `namespace/name` format |
| Regions | `entry.regions` | Vertical Tags |
| Actions | — | Failover button (local) |

**Expanded row:** Regions list + refPlugins.

---

## Routing & Navigation

### Center Mode (CenterLayout)

Routes unchanged, only swap component imports in `App.tsx`:

```diff
- import ClusterRegionRoutePage from './pages/Center/ClusterRegionRoutePage'
- import RegionRoutePage from './pages/Center/RegionRoutePage'
+ import ClusterRegionRouteList from './pages/RegionRoute/ClusterRegionRouteList'
+ import ServiceRegionRouteList from './pages/RegionRoute/ServiceRegionRouteList'
```

Paths stay: `region-routes/cluster`, `region-routes/service`. Sidebar menu unchanged.

### Controller Mode (MainLayout)

Add routes under MainLayout:

```tsx
<Route path="region-routes/cluster" element={<ControllerClusterRegionRouteList />} />
<Route path="region-routes/service" element={<ControllerServiceRegionRouteList />} />
```

Also add to ControllerProxy layout (for Center-mode drill-down into a specific controller).

Sidebar: Add "RegionRoute" submenu under Ops group (after ACME), with Cluster / Service children.

---

## i18n Changes

### New Keys

```
center.regionRoute.consistent     — "Consistent" / "一致"
center.regionRoute.inconsistent   — "Inconsistent" / "不一致"
center.regionRoute.consistencyDetail — "Consistency Detail" / "一致性详情"
nav.regionRoutes                  — "RegionRoute" / "RegionRoute"
nav.regionRouteCluster            — "Cluster" / "Cluster"
nav.regionRouteService            — "Service" / "Service"
```

### Keys to Remove

```
center.regionRoute.syncPanel
center.regionRoute.syncHint
center.regionRoute.syncToAll
center.regionRoute.syncOk
center.regionRoute.syncFail
center.regionRoute.syncBtn
```

### Reuse Existing

All other `center.regionRoute.*` and `center.clusterRoute.*` keys continue to be used.

---

## File Deletion

- `src/pages/Center/ClusterRegionRoutePage.tsx`
- `src/pages/Center/RegionRoutePage.tsx`
- 6 methods + 6 types from `src/api/center.ts` (see API Layer section)

---

## Verification

1. Build backend image and deploy to OrbStack K8s per `ws2/skills/05-center-testing/SKILL.md`
2. Start frontend dev server
3. Checklist:
   - [ ] Center `/region-routes/cluster` table displays data correctly
   - [ ] Center `/region-routes/service` table displays data correctly
   - [ ] Center expanded rows show per-controller details
   - [ ] Consistency column shows correct status with conflict Popover
   - [ ] Consistency conflicts also show as Alert in expanded rows
   - [ ] Failover operates correctly with 2s refresh delay
   - [ ] Controller mode cluster region route page works
   - [ ] Controller mode service region route page works
   - [ ] Controller mode Failover operates correctly
   - [ ] MainLayout sidebar shows RegionRoute under Ops
   - [ ] `npm run build` passes
