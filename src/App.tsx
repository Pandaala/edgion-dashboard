import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from './components/Layout/MainLayout'
import CenterLayout from './components/Layout/CenterLayout'
import ControllerProxy from './components/Layout/ControllerProxy'
import { isLoggedIn } from './utils/auth'
import { setAppMode } from './utils/proxy'
import { systemApi } from './api/client'
import LoginPage from './pages/Login/LoginPage'
import Dashboard from './pages/Dashboard'
import UserDashboard from './pages/Dashboard/UserDashboard'
import CenterDashboard from './pages/Center/CenterDashboard'
// Routes
import HTTPRouteList from './pages/Routes/HTTPRouteList'
import GRPCRouteList from './pages/Routes/GRPCRouteList'
import TCPRouteList from './pages/Routes/TCPRouteList'
import UDPRouteList from './pages/Routes/UDPRouteList'
import TLSRouteList from './pages/Routes/TLSRouteList'
// Infrastructure
import GatewayList from './pages/Infrastructure/GatewayList'
import GatewayClassList from './pages/Infrastructure/GatewayClassList'
import ServiceList from './pages/Infrastructure/ServiceList'
import EndpointSliceList from './pages/Infrastructure/EndpointSliceList'
import ReferenceGrantList from './pages/Infrastructure/ReferenceGrantList'
// Security
import EdgionTlsList from './pages/Security/EdgionTlsList'
import BackendTLSPolicyList from './pages/Security/BackendTLSPolicyList'
// Plugins
import EdgionPluginsList from './pages/Plugins/EdgionPluginsList'
import EdgionStreamPluginsList from './pages/Plugins/EdgionStreamPluginsList'
import PluginMetaDataList from './pages/Plugins/PluginMetaDataList'
// System
import EdgionGatewayConfigPage from './pages/System/EdgionGatewayConfigPage'
import LinkSysList from './pages/System/LinkSysList'
import EdgionAcmeList from './pages/System/EdgionAcmeList'
import TopologyPage from './pages/Topology/TopologyPage'
import './App.css'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// All controller sub-routes shared between controller mode and center proxy mode
function ControllerRoutes() {
  return (
    <>
      <Route index element={<Dashboard />} />
      <Route path="user" element={<UserDashboard />} />
      <Route path="topology" element={<TopologyPage />} />
      <Route path="routes">
        <Route path="http" element={<HTTPRouteList />} />
        <Route path="grpc" element={<GRPCRouteList />} />
        <Route path="tcp" element={<TCPRouteList />} />
        <Route path="udp" element={<UDPRouteList />} />
        <Route path="tls" element={<TLSRouteList />} />
      </Route>
      <Route path="infrastructure">
        <Route path="gateways" element={<GatewayList />} />
        <Route path="gatewayclasses" element={<GatewayClassList />} />
        <Route path="referencegrants" element={<ReferenceGrantList />} />
      </Route>
      <Route path="services">
        <Route path="list" element={<ServiceList />} />
        <Route path="endpointslices" element={<EndpointSliceList />} />
      </Route>
      <Route path="security">
        <Route path="tls" element={<EdgionTlsList />} />
        <Route path="backendtls" element={<BackendTLSPolicyList />} />
      </Route>
      <Route path="plugins">
        <Route index element={<EdgionPluginsList />} />
        <Route path="stream" element={<EdgionStreamPluginsList />} />
        <Route path="metadata" element={<PluginMetaDataList />} />
      </Route>
      <Route path="system">
        <Route path="config" element={<EdgionGatewayConfigPage />} />
        <Route path="linksys" element={<LinkSysList />} />
        <Route path="acme" element={<EdgionAcmeList />} />
      </Route>
    </>
  )
}

function App() {
  const [mode, setMode] = useState<'controller' | 'center' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false)
      return
    }
    systemApi
      .serverInfo()
      .then((res) => {
        const m = res.data?.mode === 'center' ? 'center' : 'controller'
        setMode(m)
        setAppMode(m)
      })
      .catch(() => {
        setMode('controller')
        setAppMode('controller')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading && isLoggedIn()) {
    return (
      <Spin
        size="large"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      />
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {mode === 'center' ? (
        <>
          <Route
            path="/"
            element={
              <RequireAuth>
                <CenterLayout />
              </RequireAuth>
            }
          >
            <Route index element={<CenterDashboard />} />
          </Route>
          <Route
            path="/controller/:controllerId"
            element={
              <RequireAuth>
                <ControllerProxy />
              </RequireAuth>
            }
          >
            <ControllerRoutes />
          </Route>
        </>
      ) : (
        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <ControllerRoutes />
        </Route>
      )}
    </Routes>
  )
}

export default App
