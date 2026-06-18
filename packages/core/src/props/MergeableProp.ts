import { castArray } from 'es-toolkit/compat'
import type { Arrayable } from 'type-fest'
import { BaseProp } from './BaseProp'

/**
 * Enables prop merging
 *
 * @see {@link https://inertiajs.com/merging-props}
 */
export abstract class MergeableProp extends BaseProp {
  protected _merge = false

  protected _deepMerge = false

  protected _matchOn: string[] = []

  protected _append = true

  protected _appendsAtPaths: string[] = []
  protected _prependsAtPaths: string[] = []

  public merge(): this {
    this._merge = true

    return this
  }

  public deepMerge(): this {
    this._deepMerge = true

    return this.merge()
  }

  public matchOn(matchOn: Arrayable<string>): this {
    this._matchOn = castArray(matchOn)

    return this
  }

  public shouldMerge(): boolean {
    return this._merge
  }

  public shouldDeepMerge(): boolean {
    return this._deepMerge
  }

  public matchesOn(): string[] {
    return this._matchOn
  }

  public appendsAtRoot(): boolean {
    return this._append && this.mergesAtRoot()
  }

  public prependsAtRoot(): boolean {
    return !this._append && this.mergesAtRoot()
  }

  protected mergesAtRoot(): boolean {
    return this._appendsAtPaths.length === 0 && this._prependsAtPaths.length === 0
  }

  public append(path: boolean | string | string[] | Record<string, string>, matchOn?: string): this {
    if (typeof path === 'boolean') {
      this._append = path
    } else if (typeof path === 'string') {
      this._appendsAtPaths.push(path)
    } else if (Array.isArray(path)) {
      for (const value of path) {
        this.append(value)
      }
    } else if (typeof path === 'object') {
      for (const [key, value] of Object.entries(path)) {
        this.append(key, value)
      }
    }

    if (typeof path === 'string' && matchOn) {
      this.matchOn([...this._matchOn, `${path}.${matchOn}`])
    }

    return this
  }

  public prepend(path: boolean | string | string[] | Record<string, string>, matchOn?: string): this {
    if (typeof path === 'boolean') {
      this._append = !path
    } else if (typeof path === 'string') {
      this._prependsAtPaths.push(path)
    } else if (Array.isArray(path)) {
      for (const value of path) {
        this.prepend(value)
      }
    } else if (typeof path === 'object') {
      for (const [key, value] of Object.entries(path)) {
        this.prepend(key, value)
      }
    }

    if (typeof path === 'string' && matchOn) {
      this.matchOn([...this._matchOn, `${path}.${matchOn}`])
    }

    return this
  }

  public appendsAtPaths(): string[] {
    return this._appendsAtPaths
  }

  public prependsAtPaths(): string[] {
    return this._prependsAtPaths
  }
}
