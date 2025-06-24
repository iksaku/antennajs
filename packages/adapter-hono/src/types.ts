import type { Context, Env } from 'hono'
import type { Inertia } from './index'

export interface InertiaEnv extends Env {
  Variables: { Inertia: Inertia }
}

export type InertiaContext = Context<InertiaEnv>
