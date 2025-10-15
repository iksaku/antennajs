export class RenderContext {
  public constructor(
    public readonly component: string,
    public readonly request: Request,
  ) {}
}
