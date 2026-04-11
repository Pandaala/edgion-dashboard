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
  ClusterOutlined,
  DatabaseOutlined,
  LinkOutlined,
  LockOutlined,
  ShareAltOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { removeToken } from '../../utils/auth'
import type { MenuProps } from 'antd'
import { useT, useLanguage } from '../../i18n/index.tsx'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const { lang, setLang } = useLanguage()

  const menuItems: MenuItem[] = [
    {
      type: 'group',
      label: t('nav.user'),
      children: [
        {
          key: '/user',
          icon: <DashboardOutlined />,
          label: t('nav.dashboard'),
        },
        {
          key: 'routes',
          icon: <ApiOutlined />,
          label: t('nav.routes'),
          children: [
            { key: '/routes/http', label: t('route.http') },
            { key: '/routes/grpc', label: t('route.grpc') },
            { key: '/routes/tcp', label: t('route.tcp') },
            { key: '/routes/udp', label: t('route.udp') },
            { key: '/routes/tls', label: t('route.tls') },
          ],
        },
        {
          key: 'services',
          icon: <DatabaseOutlined />,
          label: t('nav.services'),
          children: [
            { key: '/services/list', label: t('infra.service') },
            { key: '/services/endpointslices', label: t('infra.endpointslice') },
          ],
        },
        {
          key: 'security',
          icon: <SafetyOutlined />,
          label: t('nav.security'),
          children: [
            { key: '/security/tls', label: t('security.tls') },
            { key: '/security/backendtls', label: t('security.backendtls') },
          ],
        },
        {
          key: 'plugins',
          icon: <AppstoreOutlined />,
          label: t('nav.plugins'),
          children: [
            { key: '/plugins', label: t('plugins.edgion') },
            { key: '/plugins/stream', label: t('plugins.stream') },
            { key: '/plugins/metadata', label: t('plugins.metadata') },
          ],
        },
        {
          key: '/infrastructure/referencegrants',
          icon: <ShareAltOutlined />,
          label: t('infra.referencegrant'),
        },
      ],
    },
    {
      type: 'group',
      label: t('nav.ops'),
      children: [
        {
          key: '/',
          icon: <DashboardOutlined />,
          label: t('nav.dashboard'),
        },
        {
          key: 'infrastructure',
          icon: <ClusterOutlined />,
          label: t('nav.infrastructure'),
          children: [
            { key: '/infrastructure/gateways', label: t('infra.gateway') },
            { key: '/infrastructure/gatewayclasses', label: t('infra.gatewayclass') },
            { key: '/system/config', label: t('system.config') },
          ],
        },
        {
          key: '/system/linksys',
          icon: <LinkOutlined />,
          label: t('system.linksys'),
        },
        {
          key: '/system/acme',
          icon: <LockOutlined />,
          label: t('system.acme'),
        },
      ],
    },
  ]

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key)
  }

  // 获取当前激活的菜单 key
  const getSelectedKey = () => {
    const path = location.pathname
    // 精确匹配 /plugins 不带子路径
    if (path === '/plugins') return ['/plugins']
    return [path]
  }

  // 获取默认打开的菜单组
  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/routes')) return ['routes']
    if (path.startsWith('/infrastructure')) return ['infrastructure']
    if (path.startsWith('/services')) return ['services']
    if (path.startsWith('/security')) return ['security']
    if (path.startsWith('/plugins')) return ['plugins']
    if (path.startsWith('/system')) return ['system']
    return []
  }

  const handleLangToggle = () => {
    setLang(lang === 'en' ? 'zh' : 'en')
  }

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            letterSpacing: collapsed ? 0 : 1,
          }}
        >
          {collapsed ? 'EC' : 'Edgion Controller'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={getSelectedKey()}
          defaultOpenKeys={getOpenKeys()}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Edgion Controller Dashboard</h2>
          <Space>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              {t('login.logout')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              {t('action.refresh')}
            </Button>
            <Button icon={<GlobalOutlined />} onClick={handleLangToggle}>
              {lang === 'en' ? 'EN' : '中文'}
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
