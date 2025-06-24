import { Inertia as BaseInertia, type ThenableInertiaResponse } from '@antennajs/core'
import type { HonoRequest } from 'hono'
import type { InertiaContext } from './types'

export class Inertia extends BaseInertia {
  public constructor(
    protected readonly ctx: InertiaContext,
    _rootElementId = 'app',
  ) {
    super(_rootElementId)
  }

  public static from(ctx: InertiaContext): Inertia {
    const instance = ctx.get('Inertia')

    if (!instance) {
      throw new Error('Unable to access Inertia instance: Inertia not found in context.')
    }

    return instance
  }

  // @ts-ignore
  public render(
    ...args: Parameters<BaseInertia['render']> extends [infer _, ...infer U] ? U : never
  ): ThenableInertiaResponse {
    return super.render(this.ctx.req.raw, ...args)
  }

  public static location(
    request: HonoRequest,
    ...args: Parameters<(typeof BaseInertia)['location']> extends [infer _, ...infer U] ? U : never
  ): Response {
    return BaseInertia.location(request.raw, ...args)
  }
}
