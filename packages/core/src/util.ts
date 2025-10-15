import { isFunction } from 'es-toolkit'
import { isObjectLike, set } from 'es-toolkit/compat'
import type { Promisable } from 'type-fest'
import type { ArrayCastable, MaybeResolvable, ProvidesInertiaProperties, ProvidesInertiaProperty } from './types'

export function tap<TValue>(value: TValue, callback: (value: TValue) => void): TValue {
  callback(value)

  return value
}

export function value<T>(value: MaybeResolvable<T>, ...args: unknown[]): Promisable<T> {
  if (isFunction(value)) {
    return value(...args)
  }

  return value
}

export function blank(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim() === ''
  }

  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return !value
}

export function filled(value: unknown): boolean {
  return !blank(value)
}

function isObjectAndContainsMethod(obj: unknown, method: string): boolean {
  return isObjectLike(obj) && Object.hasOwn(obj as object, method) && isFunction(obj[method])
}

export function castsToArray(obj: unknown): obj is ArrayCastable {
  return isObjectAndContainsMethod(obj, 'toArray')
}

export function providesInertiaProperties(obj: unknown): obj is ProvidesInertiaProperties {
  return isObjectAndContainsMethod(obj, 'toInertiaProperties')
}

export function castsToInertiaProperty(obj: unknown): obj is ProvidesInertiaProperty {
  return isObjectAndContainsMethod(obj, 'toInertiaProperty')
}

export function objectPartition<V>(
  obj: Record<string, V>,
  isInTruthy: (value: V, key: string) => boolean,
): [truthy: Record<string, V>, falsy: Record<string, V>] {
  const truthy: Record<string, V> = {}
  const falsy: Record<string, V> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (isInTruthy(value, key)) {
      truthy[key] = value
    } else {
      falsy[key] = value
    }
  }

  return [truthy, falsy]
}

export function objectGroupBy<T extends object, K extends Extract<keyof T, string>, GK extends string>(
  obj: T,
  getKeyFromItem: (value: T[K], key: string) => GK,
): Record<GK, Record<string, T[K]>> {
  const groups: Record<string, Record<K, T[K]>> = {}

  for (const [key, value] of Object.entries(obj)) {
    const groupKey = getKeyFromItem(value, key)

    set(groups, [groupKey, key], value)
  }

  return groups
}
