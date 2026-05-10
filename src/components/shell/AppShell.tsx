import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ec-color-bg-base)' }}>
      <Sidebar collapsed={collapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
        <main
          style={{
            flex: 1,
            padding: 24,
            overflow: 'auto',
            background: 'var(--ec-color-bg-base)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
