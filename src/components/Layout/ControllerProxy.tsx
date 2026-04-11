import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { setActiveControllerId } from '@/utils/proxy'
import MainLayout from './MainLayout'

export default function ControllerProxy() {
  const { controllerId } = useParams<{ controllerId: string }>()

  // Set synchronously during render (before children mount/render).
  // This ensures all child components' useEffect/useQuery calls see
  // the correct controllerId — React fires children effects before
  // parent effects, so a useEffect here would be too late.
  setActiveControllerId(controllerId ?? null)

  // Cleanup only: clear the ID when leaving controller view
  useEffect(() => {
    return () => {
      setActiveControllerId(null)
    }
  }, [controllerId])

  return <MainLayout />
}
