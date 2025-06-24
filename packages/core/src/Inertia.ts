import type { Promisable } from 'type-fest'
import { InertiaResponse, type ThenableInertiaResponse } from './InertiaResponse'
import { LazyProp } from './LazyProp'
import type { InertiaSharedProps, InertiaSSR, InertiaVersion, InertiaView } from './types'
import { assign, retrieve } from './util'

export class Inertia {
  protected _version: InertiaVersion = null
  protected _sharedProps: InertiaSharedProps = {}
  protected _view: InertiaView | undefined = undefined
  protected _ssr: InertiaSSR | undefined = undefined

  public constructor(protected readonly _rootElementId = 'app') {
    // Clean up id
    this._rootElementId = this._rootElementId.replaceAll(/^['"]+|['"]+$/g, '')
  }

  public share(key: string | InertiaSharedProps, value: unknown = undefined): void {
    if (typeof key === 'string') {
      assign(this._sharedProps, key, value)
    } else if (typeof key === 'object' && key !== null && !Array.isArray(key)) {
      this._sharedProps = {
        ...this._sharedProps,
        ...Object.fromEntries(Object.entries(key)),
      }
    }
  }

  public getShared(key: string = null, _default: unknown = undefined): unknown {
    // biome-ignore lint/complexity/noExtraBooleanCast: Intended to check if an "empty" value is given
    if (!!key) {
      return retrieve(this._sharedProps, key, _default)
    }

    return this._sharedProps
  }

  public flushShared(): void {
    this._sharedProps = {}
  }

  public version(version: InertiaVersion): void {
    this._version = version
  }

  public getVersion(): Promisable<string | null> {
    if (typeof this._version === 'function') {
      return this._version()
    }

    return this._version
  }

  public setView(view: InertiaView): void {
    this._view = view
  }

  public setSSR(ssr: InertiaSSR | undefined): void {
    this._ssr = ssr
  }

  public static lazy(callback: () => unknown): LazyProp {
    return new LazyProp(callback)
  }

  public render(request: Request, component: string, props: InertiaSharedProps = {}): ThenableInertiaResponse {
    return new InertiaResponse(
      request,
      this._rootElementId,
      this.getVersion(),
      component,
      { ...this._sharedProps, ...props },
      this._view,
      this._ssr,
    )
  }

  public static location(request: Request, url: string | URL): Response {
    if (url instanceof URL) {
      url = url.href
    }

    if (request.headers.has('X-Inertia')) {
      return new Response('', {
        status: 409,
        headers: {
          'X-Inertia-Location': url,
        },
      })
    }

    return new Response('', {
      status: 302,
      headers: {
        Location: url,
      },
    })
  }
}
