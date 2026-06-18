import type { InertiaPropsContainer } from '../types'

export class PropertyContext {
  public constructor(
    public readonly key: string,
    public readonly props: InertiaPropsContainer,
    public readonly request: Request,
  ) {}
}
