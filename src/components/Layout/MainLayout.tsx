import { useState } from 'react'
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom'
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
  ArrowLeftOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { clearLoggedIn } from '../../utils/auth'
import { authApi } from '../../api/auth'
import { getAppMode } from '../../utils/proxy'
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
          key: '/topology',
          icon: <ApartmentOutlined />,
          label: t('nav.topology'),
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
            { key: '/services/endpoints', label: t('infra.endpoint') },
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

  const appMode = getAppMode()
  const isCenterMode = appMode === 'center'
  // Read controllerId from URL params (reliable during render).
  // getActiveControllerId() is set in useLayoutEffect and is null during render.
  const { controllerId: _controllerIdParam } = useParams<{ controllerId?: string }>()
  const activeControllerId = _controllerIdParam?.replace(/~/g, '/') ?? null

  // Strip the /controller/:id prefix from the current path when in Center mode
  const effectivePath = (() => {
    let path = location.pathname
    if (activeControllerId) {
      const prefix = `/controller/${activeControllerId.replace(/\//g, '~')}`
      if (path.startsWith(prefix)) {
        path = path.slice(prefix.length) || '/'
      }
    }
    return path
  })()

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    const prefix = activeControllerId ? `/controller/${activeControllerId.replace(/\//g, '~')}` : ''
    navigate(`${prefix}${e.key}`)
  }

  const getSelectedKey = () => {
    if (effectivePath === '/plugins') return ['/plugins']
    return [effectivePath]
  }

  const getOpenKeys = () => {
    if (effectivePath.startsWith('/routes')) return ['routes']
    if (effectivePath.startsWith('/infrastructure')) return ['infrastructure']
    if (effectivePath.startsWith('/services')) return ['services']
    if (effectivePath.startsWith('/security')) return ['security']
    if (effectivePath.startsWith('/plugins')) return ['plugins']
    if (effectivePath.startsWith('/system')) return ['system']
    return []
  }

  const handleLangToggle = () => {
    setLang(lang === 'en' ? 'zh' : 'en')
  }

  const handleLogout = async () => {
    await authApi.logout()
    clearLoggedIn()
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
          {isCenterMode ? (
            <span
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              title={t('center.backToCenter')}
            >
              <ArrowLeftOutlined style={{ fontSize: 14 }} />
              {collapsed ? '' : 'Controller'}
            </span>
          ) : (
            collapsed ? 'EC' : 'Edgion Controller'
          )}
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
          <Space>
            {isCenterMode && (
              <Button
                icon={<ArrowLeftOutlined />}
                type="link"
                onClick={() => navigate('/')}
                style={{ paddingLeft: 0 }}
              >
                {t('center.backToCenter')}
              </Button>
            )}
            <h2 style={{ margin: 0, fontSize: 16 }}>
              {isCenterMode && activeControllerId
                ? `Controller: ${activeControllerId}`
                : 'Edgion Controller Dashboard'}
            </h2>
          </Space>
          <Space>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              {t('login.logout')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              {t('action.refresh')}
            </Button>
            <Button icon={<GlobalOutlined />} onClick={handleLangToggle}>
              {lang === 'en' ? '中文' : 'EN'}
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
