---
"@antennajs/core": major
---

Preparing for v1: General clean up and standardization

## Breaking changes

* `InertiaVersion` type now also accepts raw `string`, `null` values or Promises returning such types, as well as functions returning `Promise`s or non-`Promise`s.
* `Inertia.getVersion()` may return a `Promise`, depending on the implementation given.