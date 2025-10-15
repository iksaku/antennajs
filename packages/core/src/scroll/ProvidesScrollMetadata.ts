import type { InertiaScrollMetadata } from '../types'

export abstract class ProvidesScrollMetadata {
  public abstract getPageName(): InertiaScrollMetadata['pageName']

  public abstract getPreviousPage(): InertiaScrollMetadata['previousPage']

  public abstract getNextPage(): InertiaScrollMetadata['nextPage']

  public abstract getCurrentPage(): InertiaScrollMetadata['currentPage']
}
