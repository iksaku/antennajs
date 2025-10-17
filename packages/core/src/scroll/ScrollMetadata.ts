import type { InertiaScrollMetadata } from '../types'
import { BaseScrollMetadata } from './BaseScrollMetadata'

export class ScrollMetadata extends BaseScrollMetadata {
  public constructor(
    protected _pageName: InertiaScrollMetadata['pageName'],
    protected _previousPage: InertiaScrollMetadata['previousPage'],
    protected _nextPage: InertiaScrollMetadata['nextPage'],
    protected _currentPage: InertiaScrollMetadata['currentPage'],
  ) {
    super()
  }

  public getPageName(): InertiaScrollMetadata['pageName'] {
    return this._pageName
  }

  public getPreviousPage(): InertiaScrollMetadata['previousPage'] {
    return this._previousPage
  }

  public getNextPage(): InertiaScrollMetadata['nextPage'] {
    return this._nextPage
  }

  public getCurrentPage(): InertiaScrollMetadata['currentPage'] {
    return this._currentPage
  }
}
