import { AsyncLocalStorage } from 'node:async_hooks'
import type {
  AlwaysProp,
  DeferProp,
  InertiaPrimitive,
  LazyProp,
  MaybeResolvable,
  MergeProp,
  OptionalProp,
  ProvidesScrollMetadata,
  Resolvable,
  ScrollProp,
} from '@antennajs/core'
import type { Promisable } from 'type-fest'
import { Inertia as BaseInertia } from '../index'

export const InertiaStorage = new AsyncLocalStorage<BaseInertia>()

type InertiaProxy = BaseInertia & {
  // Fixes static methods typing with Proxy
  lazy<TValue extends InertiaPrimitive>(callback: Resolvable<TValue>): LazyProp<TValue>
  optional<TValue extends InertiaPrimitive>(callback: Resolvable<TValue>): OptionalProp<TValue>
  defer<TValue extends InertiaPrimitive>(callback: Resolvable<TValue>, group?: string): DeferProp<TValue>
  merge<TValue extends InertiaPrimitive>(value: MaybeResolvable<TValue>): MergeProp<TValue>
  deepMerge<TValue extends InertiaPrimitive>(value: MaybeResolvable<TValue>): MergeProp<TValue>
  always<TValue extends InertiaPrimitive>(value: MaybeResolvable<TValue>): AlwaysProp<TValue>
  scroll<TValue extends InertiaPrimitive>(
    value: MaybeResolvable<TValue>,
    wrapper?: string,
    metadata?: ProvidesScrollMetadata | ((value: Promisable<TValue>) => ProvidesScrollMetadata),
  ): ScrollProp<TValue>
  location(request: Request, url: string | URL): Response
}

export const Inertia = new Proxy<InertiaProxy>(
  // @ts-expect-error
  {},
  {
    get(_, property, receiver) {
      // Ensure static methods can be recalled from Proxy.
      if (Reflect.has(BaseInertia, property)) {
        return Reflect.get(BaseInertia, property, receiver)
      }

      // If not a static method, then default to instance methods.
      const target = InertiaStorage.getStore()

      if (!target) {
        throw new Error('Unable to access Inertia instance: Not inside Inertia async context.')
      }

      return Reflect.get(target, property, receiver)
    },
  },
)
