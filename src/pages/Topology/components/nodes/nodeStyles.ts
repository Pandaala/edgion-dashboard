export interface NodeTypeConfig {
  color: string
  bgColor: string
  label: string
  width: number
  height: number
}

export const NODE_TYPE_CONFIG: Record<string, NodeTypeConfig> = {
  gateway:       { color: '#1890ff', bgColor: '#e6f7ff', label: 'infra.gateway',        width: 220, height: 80 },
  httproute:     { color: '#52c41a', bgColor: '#f6ffed', label: 'route.http',           width: 220, height: 80 },
  grpcroute:     { color: '#13c2c2', bgColor: '#e6fffb', label: 'route.grpc',           width: 220, height: 80 },
  tcproute:      { color: '#2f54eb', bgColor: '#f0f5ff', label: 'route.tcp',            width: 220, height: 70 },
  udproute:      { color: '#eb2f96', bgColor: '#fff0f6', label: 'route.udp',            width: 220, height: 70 },
  tlsroute:      { color: '#fa8c16', bgColor: '#fff7e6', label: 'route.tls',            width: 220, height: 70 },
  service:       { color: '#389e0d', bgColor: '#f6ffed', label: 'infra.service',        width: 220, height: 70 },
  edgionplugins: { color: '#fa541c', bgColor: '#fff2e8', label: 'plugins.edgion',       width: 220, height: 70 },
  edgiontls:     { color: '#eb2f96', bgColor: '#fff0f6', label: 'security.tls',         width: 220, height: 70 },
  secret:        { color: '#8c8c8c', bgColor: '#fafafa', label: 'security.secret',      width: 200, height: 60 },
}

export const baseStyle = (config: NodeTypeConfig): React.CSSProperties => ({
  border: `2px solid ${config.color}`,
  borderRadius: 8,
  background: config.bgColor,
  padding: '8px 12px',
  width: config.width,
  minHeight: config.height,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
})

export const handleStyle = (config: NodeTypeConfig): React.CSSProperties => ({
  background: config.color,
  width: 8,
  height: 8,
})
