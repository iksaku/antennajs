import type { InertiaRenderProps, InertiaSharedProps, InertiaSSR, InertiaView } from '@antennajs/core'
import { Header } from '@antennajs/core'
import { filled, tap } from '@antennajs/core/util'
import type { HonoRequest, Next } from 'hono'
import { createMiddleware as createHonoMiddleware } from 'hono/factory'
import type { Promisable } from 'type-fest'
import { Inertia } from './Inertia'
import type { InertiaContext, InertiaEnv } from './types'

export abstract class Middleware {
  public get rootElementId(): string {
    return 'app'
  }

  public version(_request: HonoRequest): Promisable<string | null> {
    return null
  }

  public share(_request: HonoRequest): InertiaSharedProps {
    return {}
  }

  public abstract view(props: InertiaRenderProps): ReturnType<InertiaView>

  public ssr(): InertiaSSR | undefined {
    return undefined
  }

  public async handle(ctx: InertiaContext, next: Next): Promise<void> {
    const request = ctx.req

    const inertia = tap(new Inertia(ctx, this.rootElementId), (inertia) => {
      inertia.version(this.version(request))
      inertia.share(this.share(request))
      inertia.setView(this.view.bind(this))
      inertia.setSSR(this.ssr())

      ctx.set('Inertia', inertia)
    })

    await next()

    let response = ctx.res

    response.headers.set('Vary', Header.INERTIA)

    if (!request.header(Header.INERTIA)) {
      return
    }

    if (request.method === 'GET' && request.header(Header.VERSION) !== (await inertia.getVersion())) {
      response = this.onVersionChange(request, response)
    }

    if (response.status === 200 && (await response.clone().text()).trim() === '') {
      response = this.onEmptyResponse(request, response)
    }

    if (response.status === 302 && ['PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      response = new Response(response.body, {
        status: 303,
        headers: response.headers,
      })
    }

    // Set to undefined initially to prevent merging response headers
    ctx.res = undefined
    ctx.res = response
  }

  public toMiddleware() {
    return createHonoMiddleware<InertiaEnv>(this.handle.bind(this))
  }

  public onEmptyResponse(request: HonoRequest, _response: Response): Response {
    const referer = request.header('referer')

    return new Response('', {
      status: 302,
      headers: {
        Location: new URL(filled(referer) ? referer : request.url).href,
      },
    })
  }

  public onVersionChange(request: HonoRequest, _response: Response): Response {
    return Inertia.location(request, request.url)
  }
}

export type InertiaMiddlewareOpts = {
  rootElementId?: string
  version?: (request: HonoRequest) => string | null
  share?: (request: HonoRequest) => InertiaSharedProps
  view: InertiaView
  ssr?: InertiaSSR
  onEmptyResponse?: (request: HonoRequest, response: Response) => Response
  onVersionChange?: (request: HonoRequest, response: Response) => Response
}

export function createMiddlewareFrom(base: typeof Middleware, opts: InertiaMiddlewareOpts) {
  const middleware = new (class extends base {
    public get rootElementId(): string {
      return opts.rootElementId ?? super.rootElementId
    }

    public version(request: HonoRequest) {
      return opts.version?.(request) ?? super.version(request)
    }

    public share(request: HonoRequest) {
      return opts.share?.(request) ?? super.share(request)
    }

    public view(...args: Parameters<InertiaView>): ReturnType<InertiaView> {
      return opts.view(...args)
    }

    public ssr(): InertiaSSR {
      return opts.ssr ?? super.ssr()
    }

    public onEmptyResponse(request: HonoRequest, response: Response): Response {
      return opts.onEmptyResponse?.(request, response) ?? super.onEmptyResponse(request, response)
    }

    public onVersionChange(request: HonoRequest, response: Response): Response {
      return opts.onVersionChange?.(request, response) ?? super.onVersionChange(request, response)
    }
  })()

  return middleware.toMiddleware()
}

export function createInertiaMiddleware(opts: InertiaMiddlewareOpts) {
  return createMiddlewareFrom(Middleware, opts)
}

export function EncryptHistoryMiddleware() {
  return createHonoMiddleware(async (ctx, next) => {
    Inertia.from(ctx).encryptHistory()

    await next()
  })
}
