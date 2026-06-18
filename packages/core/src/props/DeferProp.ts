import type { Promisable } from 'type-fest'
import type { InertiaPrimitive, Resolvable } from '../types'
import { MergeableProp } from './MergeableProp'

/**
 * Deferred props allow you to defer the loading of certain page data
 * until after the initial page render.
 * This can be useful for improving the perceived performance of your
 * app by allowing the initial page render to happen as quickly as
 * possible.
 *
 * @see {@link https://inertiajs.com/deferred-props}
 * @see {@link https://inertiajs.com/merging-props}
 */
export class DeferProp<TValue extends InertiaPrimitive> extends MergeableProp {
  public constructor(
    protected callback: Resolvable<TValue>,
    protected _group = 'default',
  ) {
    super()
    this.ignoreFirstLoad = true
  }

  public group(): string {
    return this._group
  }

  public resolve(): Promisable<TValue> {
    return this.callback()
  }
}
