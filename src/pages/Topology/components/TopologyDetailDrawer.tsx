import { Drawer, Descriptions, Tag, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useT } from '@/i18n'
import { NODE_TYPE_CONFIG } from './nodes/nodeStyles'

const KIND_TO_PATH: Record<string, string> = {
  gateway: '/infrastructure/gateways',
  httproute: '/routes/http',
  grpcroute: '/routes/grpc',
  tcproute: '/routes/tcp',
  udproute: '/routes/udp',
  tlsroute: '/routes/tls',
  service: '/services/list',
  edgionplugins: '/plugins',
  edgiontls: '/security/tls',
  secret: '/security/tls',
}

interface Props {
  visible: boolean
  data: {
    kind: string
    name: string
    namespace?: string
    resource: any
  } | null
  onClose: () => void
}

export default function TopologyDetailDrawer({ visible, data, onClose }: Props) {
  const t = useT()
  const navigate = useNavigate()

  const config = data ? (NODE_TYPE_CONFIG[data.kind] ?? null) : null
  const labels = data?.resource?.metadata?.labels as Record<string, string> | undefined
  const createdAt = data?.resource?.metadata?.creationTimestamp as string | undefined
  const listPath = data ? KIND_TO_PATH[data.kind] : undefined

  return (
    <Drawer
      title={t('topology.resourceDetail')}
      placement="right"
      width={480}
      open={visible}
      onClose={onClose}
      footer={
        listPath ? (
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={() => {
                onClose()
                navigate(listPath)
              }}
            >
              {t('topology.goToList')}
            </Button>
          </div>
        ) : null
      }
    >
      {data && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('col.type')}>
            <Tag color={config?.color ?? 'default'}>{data.kind}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('col.name')}>{data.name}</Descriptions.Item>

          {data.namespace && (
            <Descriptions.Item label={t('col.namespace')}>{data.namespace}</Descriptions.Item>
          )}

          {createdAt && (
            <Descriptions.Item label={t('col.createdAt')}>
              {new Date(createdAt).toLocaleString()}
            </Descriptions.Item>
          )}

          {labels && Object.keys(labels).length > 0 && (
            <Descriptions.Item label={t('field.labels')}>
              <Space size={4} wrap>
                {Object.entries(labels).map(([k, v]) => (
                  <Tag key={k} style={{ fontSize: 11 }}>
                    {k}={v}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
    </Drawer>
  )
}
