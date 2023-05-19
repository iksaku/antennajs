import {
  Inertia as InertiaCore,
  InertiaSSR,
  InertiaSharedProps,
  InertiaView,
  ThenableInertiaResponse,
} from '@antennajs/core'
import { tap } from '@antennajs/core/util'
import { Context, MiddlewareHandler } from 'hono'
import { Promisable } from 'type-fest'

type InertiaMiddlewareOptions = {
  htmlId?: string
  version?: (request: Request) => Promisable<string | null>
  share?: (request: Request) => InertiaSharedProps
  view?: InertiaView
  ssr?: InertiaSSR
}

export default class Inertia {
  public static get lazy() {
    return InertiaCore.lazy
  }

  public static get location() {
    return InertiaCore.location
  }

  public static render(ctx: Context, component: string, props: InertiaSharedProps = {}): ThenableInertiaResponse {
    const factory = ctx.get('Inertia') as InertiaCore | null

    if (!factory) {
      throw new Error('Inertia middleware is missing.')
    }

    return factory.render(ctx.req.raw, component, props)
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

      function setResponse(res: Response) {
        response = res
        ctx.res = undefined
        ctx.res = response
      }

      if (!request.headers.get('X-Inertia')) {
        return
      }

      if (request.method === 'GET' && request.headers.get('X-Inertia-Version') !== (await factory.getVersion())) {
        setResponse(Inertia.onVersionChange(request, response))
      }

      if (response.ok && (await response.clone().text()).trim() === '') {
        setResponse(Inertia.onEmptyResponse(request, response))
      }

      if (response.status === 302 && ['PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        setResponse(
          new Response(response.body, {
            status: 303,
            headers: response.headers,
          }),
        )
      }

      // No need to return response as it is available in request context
    }
  }

  protected static onEmptyResponse(request: Request, response: Response): Response {
    return new Response('', {
      status: 302,
      headers: {
        Location: new URL(request.url).origin,
      },
    })
  }

  protected static onVersionChange(request: Request, response: Response): Response {
    return Inertia.location(request.url, response)
  }
}
