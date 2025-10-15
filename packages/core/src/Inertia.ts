import { get, set } from 'es-toolkit/compat'
import type { Promisable } from 'type-fest'
import { InertiaResponse, type ThenableInertiaResponse } from './InertiaResponse'
import { AlwaysProp, DeferProp, LazyProp, MergeProp, OptionalProp, ScrollProp } from './props'
import type { ProvidesScrollMetadata } from './scroll'
import { Header } from './support'
import type {
  InertiaPrimitive,
  InertiaSharedProps,
  InertiaSSR,
  InertiaVersion,
  InertiaView,
  MaybeResolvable,
  Resolvable,
} from './types'
import { value } from './util'

export class Inertia {
  protected _version: InertiaVersion = null
  protected _sharedProps: InertiaSharedProps = {}
  protected _view: InertiaView | undefined = undefined
  protected _ssr: InertiaSSR | undefined = undefined
  protected _clearHistory = false
  protected _encryptHistory = false

  public constructor(protected readonly _rootElementId = 'app') {
    // Clean up id
    this._rootElementId = this._rootElementId.replaceAll(/^['"]+|['"]+$/g, '')
  }

  public share(key: string | InertiaSharedProps, value: unknown = undefined): void {
    if (typeof key === 'string') {
      set(this._sharedProps, key, value)
    } else if (typeof key === 'object' && key !== null && !Array.isArray(key)) {
      this._sharedProps = {
        ...this._sharedProps,
        ...Object.fromEntries(Object.entries(key)),
      }
    }
  }

  public getShared(key: string = null, _default: unknown = undefined): unknown {
    if (key) {
      return get(this._sharedProps, key, _default)
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
    return value(this._version)
  }

  public clearHistory(): void {
    this._clearHistory = true
  }

  public encryptHistory(encrypt = true): void {
    this._encryptHistory = encrypt
  }

  public setView(view: InertiaView): void {
    this._view = view
  }

  public setSSR(ssr: InertiaSSR | undefined): void {
    this._ssr = ssr
  }

  public static lazy<TValue extends InertiaPrimitive>(callback: Resolvable<TValue>): LazyProp<TValue> {
    return new LazyProp(callback)
  }

  public static optional<TValue extends InertiaPrimitive>(callback: Resolvable<TValue>): OptionalProp<TValue> {
    return new OptionalProp(callback)
  }

  public static defer<TValue extends InertiaPrimitive>(
    callback: Resolvable<TValue>,
    group = 'default',
  ): DeferProp<TValue> {
    return new DeferProp(callback, group)
  }

  public static merge<TValue extends InertiaPrimitive>(value: MaybeResolvable<TValue>): MergeProp<TValue> {
    return new MergeProp(value)
  }

  public static deepMerge<TValue extends InertiaPrimitive>(value: MaybeResolvable<TValue>): MergeProp<TValue> {
    return new MergeProp(value).deepMerge()
  }

  public static always<TValue extends InertiaPrimitive>(value: MaybeResolvable<TValue>): AlwaysProp<TValue> {
    return new AlwaysProp(value)
  }

  public static scroll<TValue extends InertiaPrimitive>(
    value: MaybeResolvable<TValue>,
    wrapper = 'data',
    metadata?: ProvidesScrollMetadata | ((value: Promisable<TValue>) => ProvidesScrollMetadata),
  ): ScrollProp<TValue> {
    return new ScrollProp(value, wrapper, metadata)
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

    if (request.headers.has(Header.INERTIA)) {
      return new Response('', {
        status: 409,
        headers: {
          [Header.LOCATION]: url,
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
