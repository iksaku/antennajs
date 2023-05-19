import { InertiaResponse } from './InertiaResponse'
import { LazyProp } from './LazyProp'
import { InertiaSSR, InertiaSharedProps, InertiaVersion, InertiaView } from './types'
import { assign, retrieve } from './util'

export class Inertia {
  protected _version: InertiaVersion = null
  protected _sharedProps: InertiaSharedProps = {}
  protected _view: InertiaView | undefined = undefined
  protected _ssr: InertiaSSR | undefined = undefined

  public constructor(protected readonly htmlId: string) {}

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

  public getShared(key: string = null, _default: unknown = undefined) {
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

  public getVersion() {
    return this._version()
  }

  public setView(view: InertiaView | undefined): void {
    this._view = view
  }

  public setSSR(ssr: InertiaSSR | undefined): void {
    this._ssr = ssr
  }

  public static lazy(callback: () => unknown): LazyProp {
    return new LazyProp(callback)
  }

  public render(request: Request, component: string, props: InertiaSharedProps = {}): InertiaResponse {
    return new InertiaResponse(
      request,
      this.htmlId,
      () => this.getVersion(),
      component,
      { ...this._sharedProps, ...props },
      this._view,
      this._ssr,
    )
  }
  
  public static location(url: string, response: Response): Response {
    if (response.headers.has('X-Inertia')) {
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
