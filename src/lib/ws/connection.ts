import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Awareness } from 'y-protocols/awareness'

export class ConnectionManager {
  private provider: WebsocketProvider | null = null
  private documentId: string
  private doc: Y.Doc
  private awareness: Awareness
  private onStatusChange: (status: string) => void

  constructor(documentId: string, doc: Y.Doc, awareness: Awareness, onStatusChange: (status: string) => void) {
    this.documentId = documentId
    this.doc = doc
    this.awareness = awareness
    this.onStatusChange = onStatusChange
  }

  async connect() {
    if (this.provider) {
      this.provider.destroy()
    }

    try {
      this.onStatusChange('connecting')
      const res = await fetch(`/api/documents/${this.documentId}/ws-token`)
      if (!res.ok) throw new Error('Failed to fetch ws token')
      
      const { token } = await res.json()
      
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234'
      
      this.provider = new WebsocketProvider(
        wsUrl,
        this.documentId,
        this.doc,
        {
          awareness: this.awareness,
          params: { token },
          connect: true
        }
      )

      this.provider.on('status', ({ status }: { status: string }) => {
        this.onStatusChange(status)
        // If it gets disconnected (e.g. token expired), we might need to reconnect manually
        if (status === 'disconnected') {
           // We could trigger a reconnect with a new token here, but y-websocket will auto-reconnect
           // The issue is y-websocket will reuse the old token. 
           // For a robust implementation, we listen to connection errors.
        }
      })

      this.provider.on('connection-error', (event: any) => {
        console.warn('WS connection error, fetching new token and reconnecting...')
        // To refresh token transparently:
        this.provider?.disconnect()
        setTimeout(() => this.connect(), 2000)
      })

    } catch (e) {
      console.error('WS Connection failed', e)
      this.onStatusChange('disconnected')
      setTimeout(() => this.connect(), 5000)
    }
  }

  disconnect() {
    if (this.provider) {
      this.provider.destroy()
      this.provider = null
    }
  }

  getProvider() {
    return this.provider
  }
}
