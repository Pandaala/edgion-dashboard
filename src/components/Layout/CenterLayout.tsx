import { Layout, Button, Space, Typography } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import { useT, useLanguage } from '@/i18n'
import { clearLoggedIn } from '@/utils/auth'
import { authApi } from '@/api/auth'

const { Header, Content } = Layout
const { Title } = Typography

export default function CenterLayout() {
  const t = useT()
  const navigate = useNavigate()
  const { lang, setLang } = useLanguage()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          Edgion Center
        </Title>
        <Space>
          <Button
            type="text"
            style={{ color: '#fff' }}
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </Button>
          <Button
            type="text"
            style={{ color: '#fff' }}
            onClick={async () => {
              await authApi.logout()
              clearLoggedIn()
              navigate('/login')
            }}
          >
            {t('login.logout')}
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
