import type { Promisable } from 'type-fest'
import type { InertiaPrimitive, Resolvable } from '../types'
import { BaseProp } from './BaseProp'

/**
 * NEVER included on standard visits
 * OPTIONALLY included on partial reloads
 * ONLY evaluated when needed
 *
 * @deprecated Use `OptionalProp` instead
 * @see {@link https://inertiajs.com/partial-reloads#lazy-data-evaluation}
 */
export class LazyProp<TValue extends InertiaPrimitive> extends BaseProp {
  public constructor(protected callback: Resolvable<TValue>) {
    super()
    this.ignoreFirstLoad = true
  }

  public resolve(): Promisable<TValue> {
    return this.callback()
  }
}
