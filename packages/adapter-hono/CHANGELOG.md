# @antennajs/adapter-hono

## 2.0.0-beta.3

### Patch Changes

- c8be4fb: fix(ScrollProps): Throw error after making sure we cannot get a scroll metadata provider
- Updated dependencies [c8be4fb]
  - @antennajs/core@2.0.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- 019d69e: enhancement(infinite-scroll): Ability for scroll value to provide scroll metadata
  - Testing ability to omit scroll "data wrapper".
  - Fixed typings from ScrollMetadata
- Updated dependencies [019d69e]
  - @antennajs/core@2.0.0-beta.2

## 2.0.0-beta.1

### Patch Changes

- 5151f85: fix(adapter-hono): Fix static methods cannot be called in `adapter-hono/async`
- Updated dependencies [ef8d603]
  - @antennajs/core@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- eaaf87a: InertiaJS 2.0 compatibility

### What Changed

We have upgraded the core implementation to be compatible with the new InertiaJS v2 features.
This also applies for our HonoJS adapter (currently the only we distribute).

### Breaking changes

- There were some improvements in typings across all codebase. This shouldn't represent an inconvenience
  for most of you, instead, it should more clearly outline what data types we support in every API

#### Patch Changes

- Updated dependencies [eaaf87a]
- @antennajs/core@2.0.0-beta.0

## 1.0.0

### Major Changes

- 5273708: Preparing for v1: Revamped implementation

### Changes

- New `createInertiaMiddleware()` function to configure an Inertia middleware easily.
- New `@antennajs/adapter-hono/async` package that makes Inertia globally accessible. [Checkout our new documentation](../packages/adapter-hono#globally-available-inertia-instance) to learn more.
- Updated documentation to reflect new features.
- General clean up to align with `core` changes.

### Breaking Changes

- A default export is no longer provided for the package. Please use: `import { Inertia } from '@antennajs/adapter-hono'`
- `Inertia` instance no longer accepts Hono's context as a parameter in its methods. Please use `Inertia.from(ctx)` instead as the Inertia instance is now context-aware.
- `Inertia.middleware()` method no longer available. Please the new exported function: `import { createInertiaMiddleware } from '@antennajs/adapter-hono'`.
  - If you prefer, you can extend our `Middleware` class. [Checkout our new documentation](../packages/adapter-hono#class-based-middleware) to learn more.

### Patch Changes

- 3e79ea1: Fix `main` package entry, add `module` package entry
- Updated dependencies [3e79ea1]
- Updated dependencies [67b1f0c]
  - @antennajs/core@1.0.0

## 1.0.0-beta.1

### Patch Changes

- 01a7af9: Fix `main` package entry, add `module` package entry.
- Updated dependencies [01a7af9]
  - @antennajs/core@1.0.0-beta.1

## 1.0.0-beta.0

### Major Changes

- 5273708: Preparing for v1: Revamped implementation

### Changes

- New `createInertiaMiddleware()` function to configure an Inertia middleware easily.
- New `@antennajs/adapter-hono/async` package that makes Inertia globally accessible. [Checkout our new documentation](../packages/adapter-hono#globally-available-inertia-instance) to learn more.
- Updated documentation to reflect new features.
- General clean up to align with `core` changes.

### Breaking Changes

- A default export is no longer provided for the package. Please use: `import { Inertia } from '@antennajs/adapter-hono'`
- `Inertia` instance no longer accepts Hono's context as a parameter in its methods. Please use `Inertia.from(ctx)` instead as the Inertia instance is now context-aware.
- `Inertia.middleware()` method no longer available. Please the new exported function: `import { createInertiaMiddleware } from '@antennajs/adapter-hono'`.
  - If you prefer, you can extend our `Middleware` class. [Checkout our new documentation](../packages/adapter-hono#class-based-middleware) to learn more.

### Patch Changes

- Updated dependencies [67b1f0c]
  - @antennajs/core@1.0.0-beta.0

## 0.2.1

### Patch Changes

- 44975bf: Fix InertiaResponse not properly working as a thenable
- 36dc52a: Lint + Format with Biome
- Updated dependencies [44975bf]
- Updated dependencies [36dc52a]
  - @antennajs/core@0.2.1

## 0.2.0

### Minor Changes

- 55f8186: Match Inertia's SSR spec and expect SSR payload's `head` property to be an array of strings instead of a string.

### Patch Changes

- Updated dependencies [55f8186]
  - @antennajs/core@0.2.0

## 0.1.4

### Patch Changes

- 8206f79: adapter-hono: Expose Inertia.share() API
- Updated dependencies [5633d3f]
  - @antennajs/core@0.1.3

## 0.1.3

### Patch Changes

- 9bc131b: bug(middleware): Pull referer value from request headers instead of request property
