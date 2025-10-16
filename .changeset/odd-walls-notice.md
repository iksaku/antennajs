---
"@antennajs/core": patch
---

fix(core): Fixed response props resolvers. Improved typings

* Missing `await` when resolving `toInertiaProperties()` methods.
* Fixed `Inertia.resolvePartialProperties()` only resolving `BaseProp` instances for full requests.
* Fixed resolving properties from `only` and `except` headers not supporting dot-notation filtering.
* Fixed `Inertia.resolveArrayableProperties()` trying to resolve dot-notated property keys in nested object/arrays.
* Fixed `Inertia.resolveAlways()` always filtering `onlyProps` even if there were no keys listed.
* Improved internal typings to keep as close as client-side Inertia typings, but only with the types we need on the server-side.
