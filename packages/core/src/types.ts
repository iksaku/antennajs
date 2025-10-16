import type { Page } from '@inertiajs/core'
import type { Arrayable, Primitive, Promisable } from 'type-fest'
import type { PropertyContext, RenderContext } from './context'

export type Resolvable<T> = (...args: unknown[]) => Promisable<T>
export type MaybeResolvable<T> = Promisable<T> | Resolvable<T>

export type InertiaPropsContainer<T = unknown> = Record<string, T> | T[]
export type InertiaSharedProps<T = unknown> = Record<string, T>

export type InertiaVersion = MaybeResolvable<string | null>

export type InertiaRenderProps = {
  request: Request
  data: Record<string, unknown>
  head: string[]
  body: string
}

export type InertiaView = (props: InertiaRenderProps) => Promisable<string>

export type InertiaPageResponse = Omit<Page, 'props' | 'rememberedState'> & {
  props: Omit<Page['props'], 'errors'>
}

export type InertiaSSR = (page: InertiaPageResponse) => Promise<{ head: string[]; body: string }>

export interface ArrayCastable {
  toArray<T = unknown>(): Promisable<T[]>
}

export type ProvidesInertiaProperties = {
  toInertiaProperties<T extends InertiaPropsContainer<InertiaPrimitive>>(context: RenderContext): Promisable<T>
}

export interface ProvidesInertiaProperty {
  toInertiaProperty<T extends Exclude<InertiaPrimitive, ProvidesInertiaProperty>>(
    context: PropertyContext,
  ): Promisable<T>
}

export type InertiaPrimitive = Arrayable<Primitive | object | ProvidesInertiaProperty>

export type InertiaScrollMetadata = Omit<InertiaPageResponse['scrollProps'], 'reset'>
