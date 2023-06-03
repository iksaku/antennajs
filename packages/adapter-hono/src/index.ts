import {
  Inertia as InertiaCore,
  InertiaSSR,
  InertiaSharedProps,
  InertiaView,
  ThenableInertiaResponse,
} from '@antennajs/core'
import { filled, tap } from '@antennajs/core/util'
import { Context, MiddlewareHandler } from 'hono'
import { Promisable } from 'type-fest'

type InertiaMiddlewareOptions = {
  htmlId?: string
  version?: (request: Request) => Promisable<string | null>
  share?: (request: Request) => InertiaSharedProps
  view?: InertiaView
  ssr?: InertiaSSR
}

function factory(ctx: Context): InertiaCore {
  const factory = ctx.get('Inertia') as InertiaCore | null

  if (!factory) {
    throw new Error('Inertia middleware is missing.')
  }

  return factory
}

export default class Inertia {
  public static get lazy() {
    return InertiaCore.lazy
  }

  public static location(ctx: Context, url: string | URL) {
    return InertiaCore.location(ctx.req.raw, url)
  }

  public static share(ctx: Context, key: string | InertiaSharedProps, value?: unknown): void {
    factory(ctx).share(key, value)
  }

  public static render(ctx: Context, component: string, props: InertiaSharedProps = {}): ThenableInertiaResponse {
    return factory(ctx).render(ctx.req.raw, component, props)
  }

  public static middleware({
    htmlId = 'app',
    version = () => null,
    share = () => ({}),
    view = undefined,
    ssr = undefined,
  }: InertiaMiddlewareOptions): MiddlewareHandler {
    return async (ctx, next) => {
      const request = ctx.req.raw

      const factory = tap(new InertiaCore(htmlId), (factory) => {
        factory.version(() => version(request))
        factory.share(share(request))
        factory.setView(view)
        factory.setSSR(ssr)

        ctx.set('Inertia', factory)
      })

      await next()

      let response = ctx.res
      response.headers.set('Vary', 'X-Inertia')

      if (!request.headers.get('X-Inertia')) {
        return
      }

      if (request.method === 'GET' && request.headers.get('X-Inertia-Version') !== (await factory.getVersion())) {
        response = Inertia.onVersionChange(request, response)
      }

      if (response.status === 200 && (await response.clone().text()).trim() === '') {
        response = Inertia.onEmptyResponse(request, response)
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
  }

  protected static onEmptyResponse(request: Request, response: Response): Response {
    const referer = request.headers.get('referer')

    return new Response('', {
      status: 302,
      headers: {
        Location: new URL(filled(referer) ? referer : request.url).href,
      },
    })
  }

  protected static onVersionChange(request: Request, response: Response): Response {
    return InertiaCore.location(request, request.url)
  }
}
