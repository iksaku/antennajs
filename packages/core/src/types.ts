import { Page } from '@inertiajs/core'
import { Promisable } from 'type-fest'

export type InertiaSharedProps = Record<string, unknown>
export type InertiaVersion = () => Promisable<string | null>

export type InertiaRenderProps = {
  request: Request
  data: Record<string, unknown>
  head: string
  body: string
}
export type InertiaView = (props: InertiaRenderProps) => Promisable<string>

export type InertiaSSR = (page: Page) => Promise<{ head: string; body: string }>
