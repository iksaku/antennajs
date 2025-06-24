# @antennajs/core

## 1.0.0-beta.1

### Patch Changes

- 01a7af9: Fix `main` package entry, add `module` package entry

## 1.0.0-beta.0

### Major Changes

- 67b1f0c: Preparing for v1: General clean up and standardization

### Breaking changes

- `InertiaVersion` type now also accepts raw `string`, `null` values or Promises returning such types, as well as functions returning `Promise`s or non-`Promise`s.
- `Inertia.getVersion()` may return a `Promise`, depending on the implementation given.

## 0.2.1

### Patch Changes

- 44975bf: Fix InertiaResponse not properly working as a thenable
- 36dc52a: Lint + Format with Biome

## 0.2.0

### Minor Changes

- 55f8186: Match Inertia's SSR spec and expect SSR payload's `head` property to be an array of strings instead of a string.

## 0.1.3

### Patch Changes

- 5633d3f: core: Add support for parsing Location from URL object. Fixed bug where location API receved Response instead of Request object
