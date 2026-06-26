import { WebSocketServer } from 'ws'
import http from 'http'
import jwt from 'jsonwebtoken'
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from the parent Next.js directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const port = process.env.RELAY_PORT || 1234
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Collaborativa WebSocket Relay is active.')
})

const wss = new WebSocketServer({ 
  server, 
  maxPayload: 1 * 1024 * 1024 // 1MB maximum frame size
})

wss.on('connection', (conn, req) => {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const token = url.searchParams.get('token')
    const docName = url.pathname.slice(1).split('?')[0] // remove leading slash

    if (!token) {
      conn.close(4001, 'Unauthorized')
      return
    }

    const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as { userId: string, documentId: string, role: string }
    
    if (decoded.documentId !== docName) {
      conn.close(4003, 'Forbidden')
      return
    }

    if (decoded.role === 'VIEWER') {
      // Read-only mode: Intercept and drop update messages from VIEWERS
      const originalOn = conn.on.bind(conn)
      conn.on = function(event: string | symbol, listener: (...args: any[]) => void) {
        if (event === 'message') {
          return originalOn(event, (message: any, isBinary: boolean) => {
            try {
              const arr = new Uint8Array(message as ArrayBuffer)
              if (arr.length > 0) {
                const messageType = arr[0]
                if (messageType === 0) { // Sync message
                  if (arr.length > 1 && arr[1] === 0) {
                    // Allow SyncStep1 (requesting document)
                    return listener(message, isBinary)
                  }
                  // Drop SyncStep2 and Updates
                  return
                } else if (messageType === 1) {
                  // Allow Awareness (cursors/presence)
                  return listener(message, isBinary)
                }
              }
            } catch (e) {
              // Ignore invalid messages
            }
          })
        }
        return originalOn(event, listener)
      }
    }

    // Hand over the connection to the standard y-websocket protocol
    setupWSConnection(conn, req, { docName, gc: true })
  } catch (error) {
    console.error('Connection rejected:', error)
    conn.close(4001, 'Unauthorized')
  }
})

server.listen(port, () => {
  console.log(`WebSocket Relay Server listening on port ${port}`)
})
