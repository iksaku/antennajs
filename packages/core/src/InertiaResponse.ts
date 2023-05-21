import type { Page } from '@inertiajs/core'
import { encode } from 'html-entities'
import { LazyProp } from './LazyProp'
import { InertiaRenderProps, InertiaSSR, InertiaSharedProps, InertiaVersion, InertiaView } from './types'
import { assign, objectFilter, value } from './util'

export type ThenableInertiaResponse = PromiseLike<Response> & Omit<InertiaResponse, 'then'>

export class InertiaResponse implements PromiseLike<Response> {
  protected _viewData: Record<string, unknown> = {}

  public constructor(
    protected readonly request: Request,
    protected readonly htmlId: string,
    protected _version: InertiaVersion,
    protected _component: string,
    protected _props: InertiaSharedProps,
    protected _view: InertiaView | undefined,
    protected _ssr: InertiaSSR | undefined,
  ) {}

  public with(key: string | InertiaSharedProps, value: unknown = undefined): ThenableInertiaResponse {
    if (typeof key === 'string') {
      assign(this._props, key, value)
    } else if (typeof key === 'object' && key !== null && !Array.isArray(key)) {
      this._props = {
        ...this._props,
        ...Object.fromEntries(Object.entries(key)),
      }
    }

    return this
  }

  public withViewData(key: string | object, value: unknown = undefined): ThenableInertiaResponse {
    if (typeof key === 'string') {
      assign(this._viewData, key, value)
    } else if (typeof key === 'object' && key !== null && !Array.isArray(key)) {
      this._viewData = {
        ...this._viewData,
        ...Object.fromEntries(Object.entries(key)),
      }
    }

    return this
  }

  public view(view: InertiaView): this {
    this._view = view

    return this
  }

  public async then(resolve) {
    const response = await this.toResponse(this.request)

    if (resolve) {
      return await resolve(response)
    }

    return response
  }

  protected async toResponse(request: Request): Promise<Response> {
    const only = (request.headers.get('X-Inertia-Partial-Data') ?? '').split(',').filter(Boolean)

    let props =
      only && request.headers.get('X-Inertia-Partial-Component') === this._component
        ? objectFilter(this._props, ([key]) => only.includes(key))
        : objectFilter(this._props, ([, value]) => !(value instanceof LazyProp))

    props = await this.resolvePropertyInstances(props)

    // @ts-ignore
    const page: Page = {
      component: this._component,
      props: props as Page['props'],
      url: value(() => {
        const url = new URL(request.url)

        return `${url.pathname}${url.search}`
      }),
      version: await this._version(),
    }

    if (request.headers.get('X-Inertia')) {
      return new Response(JSON.stringify(page), {
        status: 200,
        headers: {
          'X-Inertia': 'true',
          'Content-Type': 'application/json; charset=UTF-8',
        },
      })
    }

    if (!this._view) {
      throw new Error('Inertia View has not been provided.')
    }

    const { head, body } = !this._ssr
      ? {
          head: '',
          body: `<div id="${this.htmlId}" data-page="${encode(JSON.stringify(page))}"></div>`,
        }
      : await this._ssr(page)

    const renderProps: InertiaRenderProps = {
      request: this.request,
      data: this._viewData,
      head: head,
      body,
    }

    return new Response(await this._view(renderProps), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    })
  }

  protected async resolvePropertyInstances(props: object | unknown[]) {
    for (let [key, value] of Object.entries(props)) {
      if (typeof value === 'function') {
        value = value()
      }

      if (value instanceof LazyProp) {
        value = value.resolve()
      }

      // In case value is a Promise, otherwise, it resolves instantly
      value = await Promise.resolve(value)

      if (typeof value === 'object' && value !== null) {
        value = await this.resolvePropertyInstances(value)
      }

      props[key] = value
    }

    return props
  }
}
