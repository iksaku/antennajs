---
"@antennajs/adapter-hono": major
---

Preparing for v1: Revamped implementation

## Changes

* New `createInertiaMiddleware()` function to configure an Inertia middleware easily.
* New `@antennajs/adapter-hono/async` package that makes Inertia globally accessible. [Checkout our new documentation](https://github.com/iksaku/antennajs/tree/main/packages/adapter-hono#globally-available-inertia-instance) to learn more.
* Updated documentation to reflect new features.
* General clean up to align with `core` changes.

## Breaking Changes

* A default export is no longer provided for the package. Please use: `import { Inertia } from '@antennajs/adapter-hono'`
* `Inertia` instance no longer accepts Hono's context as a parameter in its methods. Please use `Inertia.from(ctx)` instead as the Inertia instance is now context-aware.
* `Inertia.middleware()` method no longer available. Please the new exported function: `import { createInertiaMiddleware } from '@antennajs/adapter-hono'`.
  * If you prefer, you can extend our `Middleware` class. [Checkout our new documentation](https://github.com/iksaku/antennajs/tree/main/packages/adapter-hono#class-based-middleware) to learn more.