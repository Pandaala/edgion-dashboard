import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Space } from 'antd'
import {
  DashboardOutlined,
  ApiOutlined,
  SafetyOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [locale, setLocale] = useState('zh-CN')
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'routes',
      icon: <ApiOutlined />,
      label: '路由管理',
      children: [
        { key: '/routes/http', label: 'HTTPRoute' },
        { key: '/routes/grpc', label: 'GRPCRoute' },
        { key: '/routes/tcp', label: 'TCPRoute' },
        { key: '/routes/udp', label: 'UDPRoute' },
        { key: '/routes/tls', label: 'TLSRoute' },
      ],
    },
    {
      key: 'services',
      icon: <ApiOutlined />,
      label: '服务管理',
      children: [
        { key: '/services', label: 'Service' },
        { key: '/endpointslices', label: 'EndpointSlice' },
      ],
    },
    {
      key: 'security',
      icon: <SafetyOutlined />,
      label: '安全配置',
      children: [
        { key: '/security/tls', label: 'TLS' },
        { key: '/security/secret', label: 'Secret' },
      ],
    },
    {
      key: 'plugins',
      icon: <AppstoreOutlined />,
      label: '插件管理',
      children: [
        { key: '/plugins', label: 'Plugins' },
        { key: '/plugin-metadata', label: 'Metadata' },
      ],
    },
  ]

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key)
  }

  const toggleLocale = () => {
    setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN')
    // TODO: Implement i18n
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'ED' : 'Edgion Dashboard'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Edgion Controller</h2>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              刷新
            </Button>
            <Button icon={<GlobalOutlined />} onClick={toggleLocale}>
              {locale}
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout

