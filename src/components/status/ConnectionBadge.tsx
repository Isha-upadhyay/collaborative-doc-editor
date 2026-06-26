"use client"
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ConnectionBadge() {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('online')

  useEffect(() => {
    const handleOnline = () => setStatus('online')
    const handleOffline = () => setStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setStatus(navigator.onLine ? 'online' : 'offline')

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-300 shadow-sm border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
      {status === 'online' && (
        <>
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-zinc-600 dark:text-zinc-300">Online</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <WifiOff size={14} className="text-zinc-400" />
          <span className="text-zinc-500">Offline</span>
        </>
      )}
      {status === 'syncing' && (
        <>
          <RefreshCw size={14} className="animate-spin text-brand" />
          <span className="text-brand">Syncing...</span>
        </>
      )}
    </div>
  )
}
