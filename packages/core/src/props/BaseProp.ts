import type { Promisable } from 'type-fest'
import type { InertiaPrimitive } from '../types'

export abstract class BaseProp {
  private _ignoreFirstLoad = false

  protected constructor() {}

  /**
   * @see {@link https://inertiajs.com/partial-reloads#lazy-data-evaluation}
   */
  public get ignoreFirstLoad() {
    return this._ignoreFirstLoad
  }

  /**
   * @see {@link https://inertiajs.com/partial-reloads#lazy-data-evaluation}
   */
  protected set ignoreFirstLoad(ignoreFirstLoad: boolean) {
    this._ignoreFirstLoad = ignoreFirstLoad
  }

  public abstract resolve(): Promisable<InertiaPrimitive>
}
