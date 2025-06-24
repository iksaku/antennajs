import type { Next } from 'hono'
import { Middleware as BaseMiddleware, createMiddlewareFrom, type InertiaMiddlewareOpts } from '../Middleware'
import type { InertiaContext } from '../types'
import { InertiaStorage } from './Inertia'

export type { InertiaMiddlewareOpts }

export abstract class Middleware extends BaseMiddleware {
  public handle(ctx: InertiaContext, next: Next): ReturnType<BaseMiddleware['handle']> {
    return super.handle(ctx, () => InertiaStorage.run(ctx.get('Inertia'), next))
  }
}

export function createInertiaMiddleware(opts: InertiaMiddlewareOpts) {
  return createMiddlewareFrom(Middleware, opts)
}
