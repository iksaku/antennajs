import { ObjectEntry } from 'type-fest/source/entry'

export function assign(obj: object, key: string | string[], value: unknown): void {
  if (typeof key === 'string') {
    key = key.split('.')
  }

  if (key.length < 2) {
    obj[key[0]] = value
    return
  }

  const k = key.shift()

  if (obj[k] === null || typeof obj[k] !== 'object') {
    obj[k] = {}
  }

  assign(obj[k], key, value)
}

export function retrieve(obj: object, key: string, _default: unknown = undefined): unknown {
  try {
    return key.split('.').reduce((obj, key) => obj[key], obj)
  } catch {
    return _default
  }
}

export function objectFilter<TObject>(obj: TObject, predicate: (entry: ObjectEntry<TObject>) => boolean): object {
  return Object.fromEntries(
    Object.entries(obj)
      // @ts-ignore
      .filter(predicate),
  )
}

export function tap<TValue extends unknown>(value: TValue, callback: (value: TValue) => void): TValue {
  callback(value)

  return value
}

export function value<TValue extends unknown>(
  value: TValue,
  ...args: unknown[]
): TValue extends () => infer R ? R : TValue {
  if (typeof value === 'function') {
    return value(...args)
  }

  // @ts-ignore
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
