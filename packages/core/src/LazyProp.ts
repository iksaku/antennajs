export class LazyProp<TValue = unknown> {
  public constructor(protected callback: () => TValue) {}

  public resolve(): TValue {
    return this.callback()
  }
}
