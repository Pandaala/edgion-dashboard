import { Row, Col, Card, Statistic } from 'antd'
import {
  ApiOutlined,
  ClusterOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const Dashboard = () => {
  // TODO: Fetch real statistics from API
  const stats = {
    httpRoutes: 10,
    services: 25,
    gateways: 5,
    health: 'Running',
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="HTTPRoutes"
              value={stats.httpRoutes}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Services"
              value={stats.services}
              prefix={<ClusterOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Gateways"
              value={stats.gateways}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="健康状态"
              value={stats.health}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="系统信息" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <p><strong>Controller:</strong> Running</p>
            <p><strong>gRPC Server:</strong> 0.0.0.0:50051</p>
          </Col>
          <Col span={12}>
            <p><strong>Admin API:</strong> 0.0.0.0:5800</p>
            <p><strong>Config Loader:</strong> Synced</p>
          </Col>
        </Row>
      </Card>

      <Card title="最近变更" style={{ marginTop: 24 }}>
        <p>• test-route 更新 (2分钟前)</p>
        <p>• backend-svc 创建 (5分钟前)</p>
        <p>• api-gateway 删除 (10分钟前)</p>
      </Card>
    </div>
  )
}

export default Dashboard

