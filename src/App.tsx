import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import { isLoggedIn } from './utils/auth'
import LoginPage from './pages/Login/LoginPage'
import Dashboard from './pages/Dashboard'
import UserDashboard from './pages/Dashboard/UserDashboard'
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
import './App.css'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="user" element={<UserDashboard />} />
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
      </Route>
    </Routes>
  )
}

export default App
