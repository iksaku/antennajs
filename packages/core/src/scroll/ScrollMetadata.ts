import type { InertiaScrollMetadata } from '../types'
import { ProvidesScrollMetadata } from './ProvidesScrollMetadata'

export class ScrollMetadata extends ProvidesScrollMetadata {
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
