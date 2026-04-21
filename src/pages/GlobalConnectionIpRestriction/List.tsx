import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Space, Switch, Select, Tag, Typography, Button, Tooltip, Popconfirm, Empty, Spin, message,
} from 'antd'
import { ReloadOutlined, PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  globalConnectionIpRestrictionApi,
  type CenterGlobalIpRestrictionView,
  type ControllerPmEntry,
} from '@/api/globalConnectionIpRestriction'
import CreateModal from './CreateModal'

const { Text } = Typography

interface FlatRow {
  controllerId: string
  namespace: string
  name: string
  entry: ControllerPmEntry
}

export default function GlobalConnectionIpRestrictionList() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['global-connection-ip-restrictions'],
    queryFn: () => globalConnectionIpRestrictionApi.list(),
    staleTime: 30_000,
  })

  const items: CenterGlobalIpRestrictionView[] = useMemo(() => {
    // response shape: { success: true, data: CenterGlobalIpRestrictionView[] }
    return (response?.data as CenterGlobalIpRestrictionView[]) ?? []
  }, [response])

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = []
    for (const item of items) {
      for (const [controllerId, entry] of Object.entries(item.controllers)) {
        rows.push({
          controllerId,
          namespace: item.namespace,
          name: item.name,
          entry,
        })
      }
    }
    return rows
  }, [items])

  const patchEnableMutation = useMutation({
    mutationFn: ({ ns, name, enable, ctrl }: { ns: string; name: string; enable: boolean; ctrl: string }) =>
      globalConnectionIpRestrictionApi.patchEnable(ns, name, enable, [ctrl]),
    onSuccess: (res) => {
      // res is the full envelope { success, data: FanOutResponse }
      const fanOut = res?.data
      if (fanOut?.failed?.length > 0) {
        message.error(`Enable toggle failed: ${fanOut.failed[0].error ?? 'unknown'}`)
      } else {
        message.success('Enable toggled')
      }
      queryClient.invalidateQueries({ queryKey: ['global-connection-ip-restrictions'] })
    },
    onError: (e: Error) => message.error(`Enable toggle error: ${e.message}`),
  })

  const patchActiveProfileMutation = useMutation({
    mutationFn: ({ ns, name, profile, ctrl }: { ns: string; name: string; profile: string; ctrl: string }) =>
      globalConnectionIpRestrictionApi.patchActiveProfile(ns, name, profile, [ctrl]),
    onSuccess: (res) => {
      const fanOut = res?.data
      if (fanOut?.failed?.length > 0) {
        message.error(`Profile switch failed: ${fanOut.failed[0].error ?? 'unknown'}`)
      } else {
        message.success('Active profile switched')
      }
      queryClient.invalidateQueries({ queryKey: ['global-connection-ip-restrictions'] })
    },
    onError: (e: Error) => message.error(`Profile switch error: ${e.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ ns, name, ctrl }: { ns: string; name: string; ctrl: string }) =>
      globalConnectionIpRestrictionApi.delete_(ns, name, [ctrl]),
    onSuccess: () => {
      message.success('Deleted')
      queryClient.invalidateQueries({ queryKey: ['global-connection-ip-restrictions'] })
    },
    onError: (e: Error) => message.error(`Delete error: ${e.message}`),
  })

  const columns = useMemo(() => [
    {
      title: 'Controller',
      dataIndex: 'controllerId',
      key: 'controllerId',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Enable',
      key: 'enable',
      render: (_: unknown, row: FlatRow) => (
        <Switch
          checked={row.entry.enable}
          loading={patchEnableMutation.isPending}
          onChange={(checked) =>
            patchEnableMutation.mutate({
              ns: row.namespace,
              name: row.name,
              enable: checked,
              ctrl: row.controllerId,
            })
          }
        />
      ),
    },
    {
      title: 'Active Profile',
      key: 'activeProfile',
      render: (_: unknown, row: FlatRow) => {
        const options = Object.keys(row.entry.profiles).map((k) => ({ label: k, value: k }))
        return (
          <Select
            value={row.entry.activeProfile}
            options={options}
            style={{ minWidth: 160 }}
            loading={patchActiveProfileMutation.isPending}
            onChange={(profile) =>
              patchActiveProfileMutation.mutate({
                ns: row.namespace,
                name: row.name,
                profile,
                ctrl: row.controllerId,
              })
            }
          />
        )
      },
    },
    {
      title: 'Profiles',
      key: 'profilesCount',
      render: (_: unknown, row: FlatRow) => {
        const names = Object.keys(row.entry.profiles).join(', ')
        return (
          <Tooltip title={names}>
            <Tag>{Object.keys(row.entry.profiles).length}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Updated',
      key: 'updated',
      render: (_: unknown, row: FlatRow) =>
        new Date(row.entry.lastModified).toLocaleString(),
    },
    {
      title: 'Hash',
      key: 'hash',
      render: (_: unknown, row: FlatRow) => (
        <Tooltip title={row.entry.contentHash}>
          <Text code>{row.entry.contentHash.slice(0, 8)}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: FlatRow) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/global-connection-ip-restrictions/${row.namespace}/${row.name}/${row.controllerId}`)
            }
          >
            Detail
          </Button>
          <Popconfirm
            title={`Delete PM '${row.namespace}/${row.name}' on ${row.controllerId}?`}
            onConfirm={() =>
              deleteMutation.mutate({ ns: row.namespace, name: row.name, ctrl: row.controllerId })
            }
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [navigate, patchEnableMutation, patchActiveProfileMutation, deleteMutation])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#888', fontSize: 13 }}>
          GlobalConnectionIpRestriction · {flatRows.length} row(s) (Controller × PM)
        </Text>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New
          </Button>
        </Space>
      </div>
      {isLoading ? (
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', minHeight: 300 }} />
      ) : flatRows.length === 0 ? (
        <Empty description="No GlobalConnectionIpRestriction PMs yet" />
      ) : (
        <Table
          dataSource={flatRows}
          columns={columns}
          rowKey={(r) => `${r.controllerId}/${r.namespace}/${r.name}`}
          pagination={{ pageSize: 20 }}
        />
      )}
      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['global-connection-ip-restrictions'] })}
      />
    </div>
  )
}
