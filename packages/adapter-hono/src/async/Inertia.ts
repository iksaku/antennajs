import { AsyncLocalStorage } from 'node:async_hooks'
import type { Inertia as BaseInertia } from '../index'

export const InertiaStorage = new AsyncLocalStorage<BaseInertia>()

export const Inertia = new Proxy<BaseInertia>(
  // @ts-ignore
  {},
  {
    get(_, property, receiver) {
      const target = InertiaStorage.getStore()

      if (!target) {
        throw new Error('Unable to access Inertia instance: Not inside Inertia async context.')
      }

      return Reflect.get(target, property, receiver)
    },
  },
)
