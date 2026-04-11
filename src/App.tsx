import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/Dashboard'
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
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
