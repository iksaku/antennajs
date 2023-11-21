# @antennajs/adapter-hono

Integrate the [InertiaJS](https://inertiajs.com) protocol in your
[HonoJS](https://hono.dev) backend.

## Installation

```shell
# Using NPM
npm install @antennajs/adapter-hono

# Using Yarn
yarn add @antennajs/adapter-hono

# Using PNPM
pnpm add @antennajs/adapter-hono
```

## Configuration

Import the `Inertia` class and globally add the middleware using `Inertia.middleware()` in your
Hono application.

```js
import { Hono } from 'hono'
import Inertia from '@antennajs/adapter-hono'

const app = new Hono()

app.use(
  '*',
  Inertia.middleware({
    view({ head, body }) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
            />
            ${head.join('')}
            <script type="module" src="/app.js"></script>
          </head>
          <body>
            ${body}
          </body>
        </html>
        `
    },
  }),
)

app.get('/', async (ctx) => {
  return Inertia.render(ctx, 'Home')
})
```

### Defining a root element

By default, Inertia assumes that your application's root template has a root element with an
`id` of `app`. If your application's root element needs a different `id`, you can provide it
using the `id` property.

```js
Inertia.middleware({
  htmlId: 'my-app',
  // ...
})
```

### Asset versioning

To enable automatic asset refreshing, you need to tell Inertia the current version of your
assets. This must be a function that returns any arbitrary string (letters, numbers or a file hash),
as long as it changes when your assets have been updated.

```js
Inertia.middleware({
  version() {
    return ...
  },
  // ...
})

// Or can be an async function as well.
Inertia.middleware({
  async version() {
    return ...
  },
  // ...
})
```

### Sharing data

You can make pieces of data available to Inertia on every request. This is typically done
outside of your controllers. Shared data will be automatically merged with the page props
provided in your controller.

```js
Inertia.middleware({
  share() {
    return {
      // Synchronously...
      'appName': ...,

      // Lazily...
      'auth.user': () => ...,
    }
  },
  // ...
})
```

Alternatively, you can manually share data using the `Inertia` class available in your request
context.

```js
app.use('*', (ctx) => {
  const Inertia = ctx.get('Inertia')

  // Key-Value pair
  Inertia?.share('appName', ...)

  // Object syntax
  Inertia?.share({
    // Synchronously...
    'appName': ...,

    // Lazily...
    'auth.user': () => ...
  })
})
```

### Customizing your root view

The `view` option of the middleware allow you to pass a function to generate your application
shell using whatever methods you like, as well as it gives you access to useful information
of the rendering cycle:

- `request`: Is the incoming [`Request`]() object.
- `data`: View-only data that is not passed down to the component. See [Root template data](#root-template-data)
- `head`: An array of strings containing the metadata of your page (Only populated when using [SSR](#server-side-rendering)).
- `body`: The compiled HTML body of your application.

```js
Inertia.middleware({
  view({ request, data, head, body }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
          />
          ${head.join('')}
          <script type="module" src="/app.js"></script>
        </head>
        <body>
          ${body}
        </body>
      </html>
      `
  },
}),
```

## Responses

Creating an Inertia response is simple. To get started, invoke the `Inertia.render()` method within
your controller or route, providing the context of the request, the name of the JavaScript
page component that you wish to render, as well as any props (data) for the component.

```js
app.get('/events/:id', (ctx) => {
  const event = ...

  return Inertia.render(ctx, 'Event/Show', {
    'event': {
      id: event.id,
      title: event.title,
      start_date: event.start_date,
      description: event.description
    }
  })
})
```

You can also add props using the `with()` method.

```js
// Key-value pair
return Inertia.render(ctx, 'Event')
  .with('event', { ... })

// Object syntax
return Inertia.render(ctx, 'Event')
  .with({
    event: { ... }
  })
```

### Root template data

Sometimes you may want to provide data to the root template that will not be sent to your JavaScript
page / component. This can be accomplished by invoking the `withViewData` method.

```js
// Key-value pair
return Inertia.render(ctx, 'Event', { event }).withViewData('meta', event.meta)

// Object syntax
return Inertia.render(ctx, 'Event', { event }).withViewData({
  meta: event.meta,
})
```

### Maximum response size

Please refer to [Inertia's Docs](https://inertiajs.com/responses#maximum-response-size) for more
information.

## Lazy data evaluation

For [partial reloads](https://inertiajs.com/partial-reloads) to be most effective, be sure to use
lazy data evaluation when returning props from your server routes or controllers. This can be accomplished
by wrapping all optional page data in a closure.

When Inertia performs a request, it will determine which data is required and only then will it evaluate the
closure. This can significantly increase the performance of pages that contain a lot of optional data.

```js
function getUsers() {
  // ...
}

return Inertia.render(ctx, 'Users/Index', {
  // ALWAYS included on first visit...
  // OPTIONALLY included on partial reloads...
  // ALWAYS evaluated...
  users: getUsers(),

  // ALWAYS included on first visit...
  // OPTIONALLY included on partial reloads...
  // ONLY evaluated when needed...
  users: () => getUsers(),

  // NEVER included on first visit...
  // OPTIONALLY included on partial reloads...
  // ONLY evaluated when needed...
  users: Inertia.lazy(() => getUsers()),
})
```

## Server-side Rendering

This adapter allows you to define a function that can completely render your frontend application
in the server without the need for an extra process to be running only to perform this operation.

> **Note**
> It should also be possible to use external rendering processes, the choice is yours.

```js
Inertia.middleware({
  ssr(page) {
    return createInertiaApp(...)
  },
  // ...
})
```

Here are some implementation examples for different frameworks:

<details>
<summary>Vue 2</summary>

```js
import { createInertiaApp } from '@inertiajs/vue2'
import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'

Inertia.middleware({
  ssr(page) {
    return createInertiaApp({
      page,
      render: createRenderer().renderToString,
      resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
        return pages[`./Pages/${name}.vue`]
      },
      setup({ App, props, plugin }) {
        Vue.use(plugin)
        return new Vue({
          render: h => h(App, props),
        })
      },
    }),
  },
  // ...
})
```

</details>

<details>
<summary>Vue 3</summary>

```js
import { createInertiaApp } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'

Inertia.middleware({
  ssr(page) {
    return createInertiaApp({
      page,
      render: renderToString,
      resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
        return pages[`./Pages/${name}.vue`]
      },
      setup({ App, props, plugin }) {
        return createSSRApp({
          render: () => h(App, props),
        }).use(plugin)
      },
    }),
  },
  // ...
})
```

</details>

<details>
<summary>React</summary>

```js
import { createInertiaApp } from '@inertiajs/react'
import ReactDOMServer from 'react-dom/server'

Inertia.middleware({
  ssr(page) {
    return createInertiaApp({
      page,
      render: ReactDOMServer.renderToString,
      resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
        return pages[`./Pages/${name}.jsx`]
      },
      setup: ({ App, props }) => <App {...props} />,
    }),
  },
  // ...
})
```

</details>

<details>
<summary>Svelte</summary>

```js
import { createInertiaApp } from '@inertiajs/svelte'

Inertia.middleware({
  ssr(page) {
    return createInertiaApp({
      page,
      resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.svelte', { eager: true })
        return pages[`./Pages/${name}.svelte`]
      },
    }),
  },
  // ...
})
```

</details>

### Client side hydration

Instructions for official framework adapters can be found in [Inertia's SSR Documentation](https://inertiajs.com/server-side-rendering#client-side-hydration).
Otherwise, please consult your framework-specific adapter for more details.
