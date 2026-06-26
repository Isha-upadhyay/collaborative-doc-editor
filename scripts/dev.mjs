// Dev launcher: runs the Next.js app and the Yjs WebSocket relay together.
// Without the relay, the editor's realtime sync can't connect and the browser
// loops forever printing "WS connection error, fetching new token and reconnecting...".
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const relayDir = path.join(root, 'relay')

const procs = [
  { name: 'next ', color: '\x1b[36m', cmd: 'npm', args: ['run', 'dev:next'], cwd: root },
  { name: 'relay', color: '\x1b[35m', cmd: 'npm', args: ['run', 'dev'], cwd: relayDir },
]

const children = []
let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  process.exit(code)
}

for (const { name, color, cmd, args, cwd } of procs) {
  const child = spawn(cmd, args, { cwd, shell: true })
  children.push(child)

  const prefix = (line) => `${color}[${name}]\x1b[0m ${line}`
  const pipe = (stream, out) => {
    let buf = ''
    stream.on('data', (chunk) => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) out.write(prefix(line) + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)

  child.on('exit', (code) => {
    process.stdout.write(prefix(`exited with code ${code}`) + '\n')
    shutdown(code ?? 0)
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
