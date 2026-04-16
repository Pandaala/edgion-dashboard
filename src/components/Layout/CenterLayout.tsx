import { useState } from 'react'
import { Layout, Menu, Button, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ClusterOutlined,
  GlobalOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { useT, useLanguage } from '@/i18n'
import { clearLoggedIn } from '@/utils/auth'
import { authApi } from '@/api/auth'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

export default function CenterLayout() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, setLang } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <ClusterOutlined />,
      label: t('center.nav.controllers'),
    },
    {
      key: 'region-route-group',
      icon: <ShareAltOutlined />,
      label: t('center.nav.regionRoutes'),
      children: [
        {
          key: '/region-routes/cluster',
          label: t('center.nav.region'),
        },
        {
          key: '/region-routes/service',
          label: t('center.nav.servicePm'),
        },
      ],
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: t('center.nav.admin'),
    },
  ]

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
        width={200}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 13 : 17,
          fontWeight: 'bold',
          letterSpacing: collapsed ? 0 : 1,
        }}>
          {collapsed ? 'EC' : 'Edgion Center'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['region-route-group']}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => key.startsWith('/') && navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Edgion Center</span>
          <Space>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              {t('login.logout')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              {t('action.refresh')}
            </Button>
            <Button icon={<GlobalOutlined />} onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
              {lang === 'en' ? '中文' : 'EN'}
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: 24, background: '#fff', padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
