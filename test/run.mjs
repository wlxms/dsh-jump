#!/usr/bin/env node
/** dsh-jump 骨架测试：插件能加载、/ide-jump/health 可达、未知路径 404。 */
import { apply, createHandler, name } from '../lib/index.js'

let passed = 0
let failed = 0
function ok(cond, label, detail) {
  if (cond) {
    passed += 1
    console.log(`  ✓ ${label}${detail === undefined ? '' : ` (${detail})`}`)
  } else {
    failed += 1
    console.error(`  ✗ ${label}${detail === undefined ? '' : ` (${detail})`}`)
  }
}

ok(name === 'dsh-jump', '插件名 dsh-jump')

const routes = []
const webServer = {
  register(spec) {
    routes.push(spec)
  },
}
apply({ get(serviceName) { return serviceName === 'webServer' ? webServer : undefined } })
ok(routes.length === 1, 'apply 注册一个 prefix route', String(routes.length))
ok(routes[0]?.kind === 'prefix' && routes[0]?.path === '/ide-jump', 'route prefix=/ide-jump')
ok(typeof routes[0]?.handler === 'function', 'route handler 是函数')

async function request(url, method = 'GET') {
  const handler = routes[0]?.handler
  let status = 0
  let body = ''
  const res = {
    writeHead(code) { status = code },
    end(text) { body = String(text ?? '') },
  }
  await handler({ method, url }, res)
  return { status, body: JSON.parse(body) }
}

const health = await request('/ide-jump/health')
ok(health.status === 200 && health.body?.ok === true, 'GET /ide-jump/health 返回 200 ok=true')
ok(health.body?.plugin?.name === 'dsh-jump' && health.body?.implemented === false, 'health 标明骨架状态', JSON.stringify(health.body?.plugin))
const missing = await request('/ide-jump/nope')
ok(missing.status === 404 && missing.body?.error === 'not-found', '未知路径返回 404')

// createHandler 可独立构造（不依赖 apply 的 webServer）。
const standalone = createHandler({ get() { return undefined } })
ok(typeof standalone === 'function', 'createHandler 可直接构造')

console.log(`\n${passed} passed / ${failed} failed`)
if (failed > 0) process.exit(1)
