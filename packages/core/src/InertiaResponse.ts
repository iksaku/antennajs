import type { Page } from '@inertiajs/core'
import { isFunction, isPlainObject, mapValues, merge, omit, omitBy, pick, pickBy, toMerged, uniq } from 'es-toolkit'
import { castArray, set } from 'es-toolkit/compat'
import { encode } from 'html-entities'
import type { Arrayable, Promisable } from 'type-fest'
import { PropertyContext, RenderContext } from './context'
import { AlwaysProp, BaseProp, DeferProp, MergeableProp, ScrollProp } from './props'
import { Header } from './support'
import type {
  InertiaPropsContainer,
  InertiaRenderProps,
  InertiaScrollMetadata,
  InertiaSharedProps,
  InertiaSSR,
  InertiaView,
  ProvidesInertiaProperties,
} from './types'
import {
  castsToArray,
  castsToInertiaProperty,
  objectGroupBy,
  objectPartition,
  providesInertiaProperties,
  value,
} from './util'

export type ThenableInertiaResponse = PromiseLike<Response> & Omit<InertiaResponse, 'then'>

export class InertiaResponse implements PromiseLike<Response> {
  protected _viewData: Record<string, unknown> = {}

  protected _cacheFor: (number | Date)[] = []

  protected _inertiaPropsProviders: ProvidesInertiaProperties[] = []

  public constructor(
    protected readonly request: Request,
    protected readonly _rootElementId: string,
    protected _version: Promisable<string | null>,
    protected _component: string,
    protected _props: InertiaSharedProps,
    protected _view?: InertiaView,
    protected _ssr?: InertiaSSR,
    protected _clearHistory = false,
    protected _encryptHistory = false,
  ) {}

  /**
   * Add additional properties to the page.
   *
   * @see {@link https://inertiajs.com/responses#properties}
   */
  public with(data: InertiaSharedProps): ThenableInertiaResponse
  public with(props: ProvidesInertiaProperties): ThenableInertiaResponse
  public with(key: string, value: unknown): ThenableInertiaResponse
  public with(
    key: string | InertiaSharedProps | ProvidesInertiaProperties,
    value: unknown = undefined,
  ): ThenableInertiaResponse {
    if (typeof key === 'string') {
      set(this._props, key, value)
    } else if (providesInertiaProperties(key)) {
      this._inertiaPropsProviders.push(key)
    } else if (isPlainObject(key)) {
      this._props = merge(this._props, key)
    }

    return this
  }

  /**
   * Add additional data to the view.
   *
   * @see {@link https://inertiajs.com/responses#root-template-data}
   */
  public withViewData(data: Record<string, unknown>): ThenableInertiaResponse
  public withViewData(key: string, value: unknown): ThenableInertiaResponse
  public withViewData(key: string | Record<string, unknown>, value: unknown = undefined): ThenableInertiaResponse {
    if (typeof key === 'string') {
      set(this._viewData, key, value)
    } else if (isPlainObject(key)) {
      this._viewData = merge(this._viewData, key)
    }

    return this
  }

  public view(view: InertiaView): ThenableInertiaResponse {
    this._view = view

    return this
  }

  public cache(cacheFor: Arrayable<number | Date>): ThenableInertiaResponse {
    this._cacheFor = castArray(cacheFor)

    return this
  }

  // biome-ignore lint/suspicious/noThenProperty: Used to chain method calls and auto-magically convert to a Response.
  // biome-ignore lint/suspicious/noExplicitAny: Too lazy to write the full type.
  public async then(resolve: any) {
    return await resolve(this.toResponse())
  }

  protected async toResponse(): Promise<Response> {
    const props = await this.resolveProperties(this._props)

    // @ts-ignore
    const page: Page = {
      ...{
        component: this._component,
        props: props as Page['props'],
        url: value(() => {
          const url = new URL(this.request.url)

          return `${url.pathname}${url.search}`
        }) as string,
        version: await this._version,
        clearHistory: this._clearHistory,
        encryptHistory: this._encryptHistory,
      },
      ...this.resolveMergeProps(),
      ...this.resolveDeferredProps(),
      ...this.resolveCacheDirections(),
      ...this.resolveScrollProps(),
    }

    if (this.request.headers.get(Header.INERTIA)) {
      return new Response(JSON.stringify(page), {
        status: 200,
        headers: {
          [Header.INERTIA]: 'true',
          'Content-Type': 'application/json; charset=UTF-8',
        },
      })
    }

    if (!this._view) {
      throw new Error('Inertia View has not been provided. Please bring your own view.')
    }

    const { head, body } = !this._ssr
      ? {
          head: [],
          body: `<div id="${this._rootElementId}" data-page="${encode(JSON.stringify(page))}"></div>`,
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

  /**
   * Resolve the properties for the response.
   */
  protected async resolveProperties(props: InertiaSharedProps): Promise<InertiaSharedProps> {
    props = await this.resolveInertiaPropsProviders(props)
    props = this.resolvePartialProperties(props)
    props = await this.resolveArrayableProperties(props)
    props = this.resolveAlways(props)
    props = await this.resolvePropertyInstances(props)

    return props
  }

  /**
   * Resolve the ProvidesInertiaProperties props.
   */
  protected async resolveInertiaPropsProviders(props: InertiaSharedProps) {
    const renderContext = new RenderContext(this._component, this.request)

    for (const value of this._inertiaPropsProviders) {
      props = toMerged(props, value.toInertiaProperties(renderContext))
    }

    return props
  }

  /**
   * Resolve properties for partial requests. Filters properties based on
   * 'only' and 'except' headers from the client, allowing for selective
   * data loading to improve performance.
   */
  protected resolvePartialProperties(props: InertiaSharedProps): InertiaSharedProps {
    if (!this.isPartial()) {
      return pickBy(props, (value) => value instanceof BaseProp && !value.ignoreFirstLoad)
    }

    const only = (this.request.headers.get(Header.PARTIAL_ONLY) ?? '').split(',').filter(Boolean)
    const except = (this.request.headers.get(Header.PARTIAL_EXCEPT) ?? '').split(',').filter(Boolean)

    if (only.length) {
      props = pick(props, only)
    }

    if (except.length) {
      props = omit(props, except)
    }

    return props
  }

  /**
   * Resolve arrayable properties and closures. Converts Arrayable objects
   * to arrays, evaluates closures, and handles dot notation properties
   * for nested data structures.
   */
  protected async resolveArrayableProperties<T extends InertiaPropsContainer>(
    props: T,
    unpackDotProps = true,
  ): Promise<T> {
    const entries = Array.isArray(props) ? props.entries() : Object.entries(props)

    for (let [key, value] of entries) {
      if (isFunction(value)) {
        value = await value()
      }

      if (castsToArray(value)) {
        value = await value.toArray()
      }

      if (Array.isArray(value) || isPlainObject(value)) {
        value = await this.resolveArrayableProperties(value)
      }

      if (unpackDotProps && typeof key === 'string' && key.includes('.')) {
        set(props, key, value)
        delete props[key]
      } else {
        props[key] = value
      }
    }

    return props
  }

  protected resolveOnly(props: InertiaSharedProps): InertiaSharedProps {
    const only = (this.request.headers.get(Header.PARTIAL_ONLY) ?? '').split(',').filter(Boolean)

    return pick(props, only)
  }

  protected resolveExcept(props: InertiaSharedProps): InertiaSharedProps {
    const except = (this.request.headers.get(Header.PARTIAL_EXCEPT) ?? '').split(',').filter(Boolean)

    return omit(props, except)
  }

  protected resolveAlways(props: InertiaSharedProps): InertiaSharedProps {
    const always = pickBy(this._props, (value) => value instanceof AlwaysProp)

    return toMerged(always, props)
  }

  /**
   * Resolve all necessary class instances in the given props.
   */
  protected async resolvePropertyInstances<T extends InertiaPropsContainer>(props: T, parentKey?: string): Promise<T> {
    const entries = Array.isArray(props) ? props.entries() : Object.entries(props)

    for (let [key, value] of entries) {
      if (value instanceof ScrollProp) {
        value.configureMergeIntent(this.request)
      }

      if (isFunction(value)) {
        value = await value()
      } else if (value instanceof BaseProp) {
        value = await value.resolve()
      }

      const currentKey = parentKey ? `${parentKey}.${key}` : String(key)

      if (castsToInertiaProperty(value)) {
        value = await value.toInertiaProperty(new PropertyContext(currentKey, props, this.request))
      }

      if (castsToArray(value)) {
        value = await value.toArray()
      }

      if (Array.isArray(value) || isPlainObject(value)) {
        value = await this.resolvePropertyInstances(value, currentKey)
      }

      props[key] = value
    }

    return props
  }

  /**
   * Resolve the cache directions for the response.
   */
  protected resolveCacheDirections(): { cache?: number[] } {
    if (this._cacheFor.length === 0) {
      return {}
    }

    return {
      cache: this._cacheFor.map((value) => {
        if (value instanceof Date) {
          return Math.floor(Math.abs((Date.now() - value.getTime()) / 1000))
        }

        return value
      }),
    }
  }

  /**
   * Get the props that should be reset based on the request headers.
   */
  protected getResetProps(): string[] {
    return (this.request.headers.get(Header.RESET) ?? '').split(',').filter(Boolean)
  }

  /**
   * Get the props that should be considered for merging based on the request headers.
   */
  protected getMergePropsForRequest(rejectResetProps = true): InertiaSharedProps<MergeableProp> {
    const resetProps = rejectResetProps ? this.getResetProps() : []
    const onlyProps = (this.request.headers.get(Header.PARTIAL_ONLY) ?? '').split(',').filter(Boolean)
    const exceptProps = (this.request.headers.get(Header.PARTIAL_EXCEPT) ?? '').split(',').filter(Boolean)

    let props = pickBy(this._props, (prop) => prop instanceof MergeableProp) as InertiaSharedProps<MergeableProp>
    props = pickBy(props, (prop) => prop.shouldMerge())
    props = omit(props, resetProps)
    props = pick(props, onlyProps)
    props = omit(props, exceptProps)

    return props
  }

  /**
   * Resolve merge props configuration for client-side prop merging.
   */
  protected resolveMergeProps(): Record<string, string[]> {
    const mergeProps = this.getMergePropsForRequest()

    return pickBy(
      {
        mergeProps: this.resolveAppendMergeProps(mergeProps),
        prependProps: this.resolvePrependMergeProps(mergeProps),
        deepMergeProps: this.resolveDeepMergeProps(mergeProps),
        matchPropsOn: this.resolveMergeMatchingKeys(mergeProps),
      },
      (props) => props.length > 0,
    )
  }

  /**
   * Resolve props that should be appended during merging.
   */
  protected resolveAppendMergeProps(props: InertiaSharedProps<MergeableProp>): string[] {
    const [rootAppendProps, nestedAppendProps] = objectPartition(
      omitBy(props, (prop) => prop.shouldDeepMerge()),
      (prop) => prop.appendsAtRoot(),
    )

    return uniq(
      Object.entries(nestedAppendProps)
        .flatMap(([key, prop]) => prop.appendsAtPaths().map((path) => `${key}.${path}`))
        .concat(...Object.keys(rootAppendProps)),
    )
  }

  /**
   * Resolve props that should be prepended during merging.
   */
  protected resolvePrependMergeProps(props: InertiaSharedProps<MergeableProp>): string[] {
    const [rootPrependProps, nestedPrependProps] = objectPartition(
      omitBy(props, (prop) => prop.shouldDeepMerge()),
      (prop) => prop.prependsAtRoot(),
    )

    return uniq(
      Object.entries(nestedPrependProps)
        .flatMap(([key, prop]) => prop.prependsAtPaths().map((path) => `${key}.${path}`))
        .concat(...Object.keys(rootPrependProps)),
    )
  }

  /**
   * Resolve props that should be deep merged.
   */
  protected resolveDeepMergeProps(props: InertiaSharedProps<MergeableProp>): string[] {
    return Object.keys(pickBy(props, (prop) => prop.shouldDeepMerge()))
  }

  /**
   * Resolve the matching keys for merge props.
   */
  protected resolveMergeMatchingKeys(props: InertiaSharedProps<MergeableProp>): string[] {
    return Object.entries(props).flatMap(([key, prop]) => prop.matchesOn().map((strategy) => `${key}.${strategy}`))
  }

  /**
   * Resolve deferred props configuration for client-side lazy loading.
   */
  protected resolveDeferredProps(): { deferredProps?: Record<string, string[]> } {
    if (this.isPartial()) {
      return {}
    }

    const deferredProps = mapValues(
      objectGroupBy(
        // Only keep Defer props
        pickBy(this._props, (prop) => prop instanceof DeferProp) as InertiaSharedProps<DeferProp<any>>,
        // And make groups
        (prop) => prop.group(),
      ),
      // Finally, transform each group to be an array of prop string keys
      (group) => Object.keys(group),
    )

    return Object.keys(deferredProps).length > 0 ? { deferredProps } : {}
  }

  /**
   * Resolve scroll props configuration for client-side infinite scrolling.
   */
  protected resolveScrollProps(): { scrollProps?: Partial<InertiaScrollMetadata & { reset: boolean }> } {
    const resetProps = this.getResetProps()

    const scrollProps = mapValues(
      // Only keep Scroll props
      pickBy(this.getMergePropsForRequest(false), (prop) => prop instanceof ScrollProp) as InertiaSharedProps<
        ScrollProp<any>
      >,
      // And resolve each props' metadata
      (prop, key) => ({
        ...prop.metadata(),
        reset: resetProps.includes(key),
      }),
    )

    return Object.keys(scrollProps).length > 0 ? { scrollProps } : {}
  }

  /**
   * Determine if the request is a partial request.
   */
  public isPartial(): boolean {
    return this.request.headers.get(Header.PARTIAL_COMPONENT) === this._component
  }
}
