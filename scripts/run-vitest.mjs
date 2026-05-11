#!/usr/bin/env node
// Wrapper around `vitest run` that drops known-harmless lines from stderr:
//   1. Vite "Sourcemap for ... points to missing source files" — emitted
//      because @fit3x/workout-engine ships dist/*.js.map referring to
//      src/*.ts files that aren't in the published tarball.
//   2. workerd "exception = workerd/api/web-socket.c++:NNN: disconnected:
//      WebSocket peer disconnected" — workerd teardown log printed when
//      its internal control channel closes between the parent process
//      and the isolate. Cannot be suppressed via miniflare log levels
//      because workerd writes it to the inherited stderr directly.
import { spawn } from 'node:child_process'

const NOISE = [
  /Sourcemap for .* points to missing source files/,
  /workerd\/api\/web-socket\.c\+\+:\d+: disconnected: WebSocket peer disconnected/,
]

const child = spawn('vitest', ['run', ...process.argv.slice(2)], {
  env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? '1' },
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
})

const makeFilter = (out) => {
  let pending = ''
  return (chunk) => {
    pending += chunk.toString()
    const lines = pending.split('\n')
    pending = lines.pop() ?? ''
    for (const line of lines) {
      if (line === '' || !NOISE.some((p) => p.test(line))) {
        out.write(line + '\n')
      }
    }
  }
}
child.stdout.on('data', makeFilter(process.stdout))
child.stderr.on('data', makeFilter(process.stderr))

child.on('close', (code) => {
  process.exit(code ?? 0)
})
