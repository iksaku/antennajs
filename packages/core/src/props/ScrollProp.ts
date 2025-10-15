import type { Promisable } from 'type-fest'
import { ProvidesScrollMetadata } from '../scroll/ProvidesScrollMetadata'
import { Header } from '../support'
import type { InertiaPrimitive, InertiaScrollMetadata, MaybeResolvable } from '../types'
import { value } from '../util'
import { MergeableProp } from './MergeableProp'

/**
 * Provides a server-side configuration for infinite scrolling.
 * It automatically configures the proper merge behavior so
 * that new data is appended or prepended to existing content
 * instead of replacing it, and normalizes pagination metadata
 * for the frontend component.
 *
 * Unlike our Laravel counterpart, we require you to provide your
 * own metadata resolver not to intervene with your implementation.
 *
 * @see {@link https://inertiajs.com/infinite-scroll#inertia-scroll-method}
 * @see {@link https://inertiajs.com/merging-props}
 */
export class ScrollProp<TValue extends InertiaPrimitive> extends MergeableProp {
  protected _resolved: Promisable<TValue> = undefined

  public constructor(
    protected value: MaybeResolvable<TValue>,
    protected wrapper = 'data',
    protected _metadata?: ProvidesScrollMetadata | ((value: Promisable<TValue>) => ProvidesScrollMetadata),
  ) {
    super()
    this._merge = true
  }

  public configureMergeIntent(request: Request): this {
    return request.headers.get(Header.INERTIA_INFINITE_SCROLL_MERGE_INTENT) === 'prepend'
      ? this.prepend(this.wrapper)
      : this.append(this.wrapper)
  }

  protected resolveMetadataProvider(): ProvidesScrollMetadata {
    if (!this._metadata) {
      throw new Error(
        'Inertia Scroll Metadata Provider was not provided. Please bring your own scroll metadata provider.',
      )
    }

    if (this._metadata instanceof ProvidesScrollMetadata) {
      return this._metadata
    }

    const value = this.resolve()

    return this._metadata(value)
  }

  public metadata(): InertiaScrollMetadata {
    const metadataProvider = this.resolveMetadataProvider()

    return {
      pageName: metadataProvider.getPageName(),
      previousPage: metadataProvider.getPreviousPage(),
      nextPage: metadataProvider.getNextPage(),
      currentPage: metadataProvider.getCurrentPage(),
    }
  }

  public resolve(): Promisable<TValue> {
    if (!this._resolved) {
      this._resolved = value(this.value)
    }

    return this._resolved
  }
}
