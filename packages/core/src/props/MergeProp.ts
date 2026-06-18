import type { Promisable } from 'type-fest'
import type { InertiaPrimitive, MaybeResolvable } from '../types'
import { value } from '../util'
import { MergeableProp } from './MergeableProp'

/**
 * Inertia overwrites props with the same name when reloading a page.
 * However, you may need to merge new data with existing data instead.
 * For example, when implementing a "load more" button for paginated results.
 *
 * Prop merging only works during partial reloads. Full page visits will
 * always replace props entirely, even if you've marked them for merging.
 *
 * @see {@link https://inertiajs.com/partial-reloads#lazy-data-evaluation}
 */
export class MergeProp<TValue extends InertiaPrimitive> extends MergeableProp {
  public constructor(protected value: MaybeResolvable<TValue>) {
    super()
    this._merge = true
  }

  public resolve(): Promisable<TValue> {
    return value(this.value)
  }
}
