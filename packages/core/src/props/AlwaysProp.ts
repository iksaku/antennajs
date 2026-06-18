import type { Promisable } from 'type-fest'
import type { InertiaPrimitive, MaybeResolvable } from '../types'
import { value } from '../util'
import { BaseProp } from './BaseProp'

/**
 * ALWAYS included on standard visits
 * ALWAYS included on partial reloads
 * ALWAYS evaluated when needed
 *
 * @see {@link https://inertiajs.com/partial-reloads#lazy-data-evaluation}
 */
export class AlwaysProp<TValue extends InertiaPrimitive> extends BaseProp {
  public constructor(protected value: MaybeResolvable<TValue>) {
    super()
  }

  public resolve(): Promisable<TValue> {
    return value(this.value)
  }
}
