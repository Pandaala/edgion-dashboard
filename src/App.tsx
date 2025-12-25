import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/Dashboard'
import HTTPRouteList from './pages/Routes/HTTPRouteList'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="routes">
          <Route path="http" element={<HTTPRouteList />} />
          {/* More routes will be added */}
        </Route>
      </Route>
    </Routes>
  )
}

export default App

