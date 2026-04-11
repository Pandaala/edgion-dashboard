import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { setActiveControllerId } from '@/utils/proxy'
import MainLayout from './MainLayout'

export default function ControllerProxy() {
  const { controllerId } = useParams<{ controllerId: string }>()

  // URL uses "~" instead of "/" in controller_id (browser decodes %2F).
  // Restore to real id for display/API usage; the proxy interceptor
  // in client.ts converts back to "~" when building proxy URLs.
  const realId = controllerId?.replace(/~/g, '/') ?? null
  setActiveControllerId(realId)

  // Cleanup only: clear the ID when leaving controller view
  useEffect(() => {
    return () => {
      setActiveControllerId(null)
    }
  }, [controllerId])

  return <MainLayout />
}
