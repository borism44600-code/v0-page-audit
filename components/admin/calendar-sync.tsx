'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  Calendar,
  Clock,
  Loader2,
  Save,
  Unlink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CalendarSyncProps {
  propertyId: string
  propertyTitle: string
  className?: string
}

interface SyncStatus {
  propertyId: string
  propertyTitle: string
  internalIcalUrl: string
  airbnbIcalUrl?: string
  lastSyncAt?: string
  status: 'idle' | 'syncing' | 'success' | 'error'
  error?: string
  eventsCount?: number
}

export function CalendarSync({ propertyId, propertyTitle, className }: CalendarSyncProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [airbnbUrl, setAirbnbUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch current sync status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/ical/sync?propertyId=${propertyId}`)
        const data = await response.json()
        setSyncStatus(data)
        if (data.airbnbIcalUrl) {
          setAirbnbUrl(data.airbnbIcalUrl)
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStatus()
  }, [propertyId])

  // Save Airbnb URL
  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          airbnbIcalUrl: airbnbUrl || null,
          action: 'save'
        })
      })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Saved successfully' })
        // Refresh status
        const statusResponse = await fetch(`/api/ical/sync?propertyId=${propertyId}`)
        setSyncStatus(await statusResponse.json())
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save' })
    } finally {
      setIsSaving(false)
    }
  }

  // Sync now
  const handleSync = async () => {
    if (!airbnbUrl && !syncStatus?.airbnbIcalUrl) {
      setMessage({ type: 'error', text: 'Please enter an Airbnb iCal URL first' })
      return
    }
    
    setIsSyncing(true)
    setMessage(null)
    try {
      const response = await fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          airbnbIcalUrl: airbnbUrl || undefined,
          action: 'sync'
        })
      })
      const data = await response.json()
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Synced ${data.eventsCount} events from Airbnb` 
        })
        // Refresh status
        const statusResponse = await fetch(`/api/ical/sync?propertyId=${propertyId}`)
        setSyncStatus(await statusResponse.json())
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Sync failed' })
    } finally {
      setIsSyncing(false)
    }
  }

  // Copy internal URL to clipboard
  const handleCopyUrl = async () => {
    if (syncStatus?.internalIcalUrl) {
      await navigator.clipboard.writeText(syncStatus.internalIcalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-card rounded-xl border border-border p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gold/10">
            <Calendar className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold">Calendar Synchronization</h3>
            <p className="text-sm text-muted-foreground">{propertyTitle}</p>
          </div>
        </div>
        {syncStatus?.status && (
          <Badge 
            variant={
              syncStatus.status === 'success' ? 'default' :
              syncStatus.status === 'error' ? 'destructive' :
              syncStatus.status === 'syncing' ? 'secondary' : 'outline'
            }
            className="capitalize"
          >
            {syncStatus.status === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {syncStatus.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
            {syncStatus.status === 'syncing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            {syncStatus.status}
          </Badge>
        )}
      </div>

      {/* Import from Airbnb */}
      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Import from Airbnb
        </label>
        <p className="text-xs text-muted-foreground">
          Paste your Airbnb calendar export URL to sync blocked dates automatically.
        </p>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.airbnb.com/calendar/ical/..."
            value={airbnbUrl}
            onChange={(e) => setAirbnbUrl(e.target.value)}
            className="flex-1 font-mono text-sm"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            title="Save URL"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
          <Button 
            onClick={handleSync}
            disabled={isSyncing || (!airbnbUrl && !syncStatus?.airbnbIcalUrl)}
            className="gap-2"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Now
          </Button>
        </div>
        
        {/* Last sync info */}
        {syncStatus?.lastSyncAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last synced: {new Date(syncStatus.lastSyncAt).toLocaleString()}
            {syncStatus.eventsCount !== undefined && (
              <span>({syncStatus.eventsCount} events)</span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Export to Airbnb */}
      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Export to Airbnb
        </label>
        <p className="text-xs text-muted-foreground">
          Copy this URL and paste it into your Airbnb calendar import settings.
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={syncStatus?.internalIcalUrl || ''}
            readOnly
            className="flex-1 font-mono text-sm bg-muted"
          />
          <Button 
            variant="outline" 
            onClick={handleCopyUrl}
            className="gap-2"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <a 
            href="https://www.airbnb.com/help/article/99" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            How to import calendars on Airbnb
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm",
          message.type === 'success' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
        )}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  )
}

// Compact version for property table rows
export function CalendarSyncBadge({ 
  status, 
  lastSyncAt 
}: { 
  status: 'idle' | 'syncing' | 'success' | 'error'
  lastSyncAt?: string 
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2 h-2 rounded-full",
        status === 'success' ? "bg-green-500" :
        status === 'error' ? "bg-red-500" :
        status === 'syncing' ? "bg-yellow-500 animate-pulse" :
        "bg-gray-400"
      )} />
      <span className="text-xs text-muted-foreground">
        {status === 'success' && lastSyncAt 
          ? `Synced ${new Date(lastSyncAt).toLocaleDateString()}`
          : status === 'error' ? 'Sync error'
          : status === 'syncing' ? 'Syncing...'
          : 'Not synced'
        }
      </span>
    </div>
  )
}
