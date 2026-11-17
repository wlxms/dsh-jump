/**
 * dsh-jump — Host 半骨架
 *
 * 目标：把 IDE 跳转（探测、最近工作区、复用窗口、启动）从 dsh-ehm 抽成
 * 独立 Host 服务，dsh-ehm 只调用 HTTP 接口。
 *
 * 当前阶段只注册 /ide-jump/health，避免在核心迁移完成前出现“看起来能用、
 * 实际没有实现”的接口。核心迁移时在这个文件里补：
 *
 *   GET  /ide-jump/ides
 *   POST /ide-jump/settings
 *   POST /ide-jump/open
 *
 * @module dsh-jump
 */

export const name = 'dsh-jump'
export const VERSION = '0.1.0'
export const inject = ['webServer']

const ROUTE_PREFIX = '/ide-jump'

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  })
  res.end(body)
}

function resolveHostService(ctx, serviceName) {
  for (const key of [serviceName, `dsh-${serviceName}`]) {
    for (const getter of ['get', 'resolve']) {
      if (ctx !== null && ctx !== undefined && typeof ctx[getter] === 'function') {
        try {
          const service = ctx[getter](key)
          if (service !== undefined && service !== null) return service
        } catch { /* ignore */ }
      }
    }
  }
  return undefined
}

export function createHandler(ctx) {
  return async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (req.method === 'GET' && url.pathname === `${ROUTE_PREFIX}/health`) {
        sendJson(res, 200, {
          ok: true,
          plugin: { name, version: VERSION },
          implemented: false,
          message: 'dsh-jump 骨架已加载；核心跳转实现待从 dsh-ehm 迁移',
        })
        return
      }
      sendJson(res, 404, { ok: false, error: 'not-found' })
    } catch (error) {
      sendJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
    }
  }
}

export function apply(ctx) {
  try {
    const webServer = resolveHostService(ctx, 'webServer')
    if (webServer === undefined || typeof webServer.register !== 'function') {
      console.warn('[dsh-jump] webServer 服务不可用，/ide-jump/* 未注册')
      return
    }
    webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: createHandler(ctx) })
  } catch (error) {
    console.warn('[dsh-jump] apply 失败：' + String(error && error.message ? error.message : error))
  }
}
