import type { ColumnsType } from 'antd/es/table'
import type { K8sResource, ResourceKey } from '@/api/types'
import AgeCell from './AgeCell'

interface Options {
  /** True if the kind is namespaced (adds NAMESPACE column). */
  namespaced: boolean
  /** Translated column titles (caller passes from useT). */
  titles: {
    name: string
    namespace: string
    age: string
  }
}

/**
 * Returns the leading Antd Table columns for any resource list:
 * NAME, NAMESPACE (when namespaced), AGE. Spread into the per-page
 * columns array before domain-specific columns:
 *
 *   const columns = [
 *     ...getResourceMetaColumns({ namespaced: true, titles: ... }),
 *     ...domainColumns,
 *     actionColumn,
 *   ]
 */
export function getResourceMetaColumns<T extends K8sResource | ResourceKey>(
  opts: Options,
): ColumnsType<T> {
  const cols: ColumnsType<T> = [
    {
      title: opts.titles.name,
      dataIndex: ['metadata', 'name'],
      key: 'name',
    },
  ]
  if (opts.namespaced) {
    cols.push({
      title: opts.titles.namespace,
      dataIndex: ['metadata', 'namespace'],
      key: 'namespace',
    })
  }
  cols.push({
    title: opts.titles.age,
    key: 'age',
    width: 120,
    render: (_: unknown, record: T) => <AgeCell timestamp={record.metadata?.creationTimestamp} />,
  })
  return cols
}
