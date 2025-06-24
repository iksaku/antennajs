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

Import the `createInertiaMiddleware` function and create a middleware for your
Hono application:

```js
import { Hono } from 'hono'
import { createInertiaMiddleware } from '@antennajs/adapter-hono'

const app = new Hono()

app.use(
  '*',
  createInertiaMiddleware({
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
```

You will then be able to access the current Inertia instance using Hono's context object to
render components:

```js
app.get('/', (ctx) => {
    return ctx.get('Inertia').render('Home')
})

// Or...

app.get('/', (ctx) => {
    return ctx.var.Inertia.render('Home')
})

// Or...
import { Inertia } from '@antennajs/adapter-hono'

app.get('/', (ctx) => {
    return Inertia.from(ctx).render('Home')
})
```

> [!TIP]
> We also provide a way to access the current Inertia instance globally,
> so you don't need to use Hono's context to access it.
> 
> [Learn more](#globally-available-inertia-instance)

### Class-based Middleware

If you are used to or just like making middlewares with classes, there's also a way to do it:

```ts
import { Hono } from 'hono'
import { Middleware as InertiaMiddleware, type InertiaRenderProps } from '@antennajs/adapter-hono'

class Middleware extends InertiaMiddleware {
  public view(props: InertiaRenderProps): string {
    return ...
  }
}

const app = new Hono()

app.use(*, new Middleware().toMiddleware())
```

Calling `toMiddleware()` may seem redundant, however:
1. Hono does not support class-based middlewares, so we need to cast it.
2. We instruct Hono about context now containing our `Inertia` instance, so it has proper typing.

### Defining a root element

By default, Inertia assumes that your application's root template has a root element with an
`id` of `app`. If your application's root element needs a different `id`, you can provide it
using the `id` property.

```js
createInertiaMiddleware({
  rootElementId: 'my-app',
  // ...
})
```

> [!CAUTION]
> This only modifies backend render behavior.
> 
> It is important to remember to also update the provided `id` for your client-side configuration.
> 
> If you have configured server-side rendering, you must also give it the same `id`.

### Asset versioning

To enable automatic asset refreshing, you need to tell Inertia the current version of your
assets. This must be a function that returns any arbitrary string (letters, numbers or a file hash),
as long as it changes when your assets have been updated.

```ts
import type { HonoRequest } from 'hono'

createInertiaMiddleware({
  version(request: HonoRequest): string | null {
    return ...
  },
  // ...
})

// Or can be an async function as well.
createInertiaMiddleware({
  async version(request: HonoRequest): PromiseLike<string | null> {
    return ...
  },
  // ...
})
```

### Sharing data

You can make pieces of data available to Inertia on every request. This is typically done
outside your controllers. Shared data will be automatically merged with the page props
provided in your controller.

```ts
import type { InertiaSharedProps } from "@antennajs/adapter-hono";

createInertiaMiddleware({
  share(): InertiaSharedProps {
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

You can also share data with the `Inertia` instance available in your request
context later. For example, in a middleware:

```js
import { createInertiaMiddleware } from '@antennajs/adapter-hono'

app.use('*', createInertiaMiddleware({ ... }), (ctx) => {
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

- `data`: View-only data that is not passed down to the component. See [Root template data](#root-template-data)
- `head`: An array of strings containing the metadata of your page (Only populated when using [SSR](#server-side-rendering)).
- `body`: The compiled HTML body of your application.
- `request`: Is the incoming [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object.

> [!IMPORTANT]
> The `request` property is NOT an instance of `HonoRequest`, it is
> a native [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object.

```js
createInertiaMiddleware({
  view({ data, head, body, request }): string {
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

Creating an Inertia response is straightforward. To get started, invoke the `Inertia.render()` method within
your controller or route, providing the context of the request, the name of the JavaScript
page component that you wish to render, as well as any props (data) for the component.

```js
app.get('/events/:id', (ctx) => {
  const event = { ... }

  return ctx.get('Inertia')
    .render('Event/Show', {
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
return ctx.get('Inertia')
  .render('Event')
  .with('event', { ... })

// Object syntax
return ctx.get('Inertia')
  .render('Event')
  .with({
    event: { ... }
  })
```

### Root template data

Sometimes you may want to provide data to the root template that will not be sent to your JavaScript
page / component. This can be achieved by invoking the `withViewData` method.

```js
// Key-value pair
return ctx.get('Inertia')
  .render('Event', { event })
  .withViewData('meta', event.meta)

// Object syntax
return ctx.get('Inertia')
  .render('Event', { event })
  .withViewData({
    meta: event.meta,
  })
```

This data is injected into the `data` property of the `view()` method in your middleware:

```js
createInertiaMiddleware({
  view({ data, head, body }): string {
    return ...
  },
}),
```

### Maximum response size

Please refer to [Inertia's Docs](https://inertiajs.com/responses#maximum-response-size) for more
information.

## Lazy data evaluation

For [partial reloads](https://inertiajs.com/partial-reloads) to be most effective, be sure to use
lazy data evaluation when returning props from your server routes or controllers. This can be achieved
by wrapping all optional page data in a closure.

When Inertia performs a request, it will determine which data is required and only then will it evaluate the
closure. This can significantly increase the performance of pages that contain a lot of optional data.

```js
import { Inertia } from '@antennajs/adapter-hono'

function getUsers() {
  // ...
}

return ctx.get('Inertia')
  .render('Users/Index', {
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

> [!TIP]
> You can also create lazy properties with the Inertia instance from context.
> 
> Both options give the same result. Use whichever you prefer 👍

```js
ctx.get('Inertia').lazy(() => ...)
```

## Globally available Inertia instance

Using Hono's context object to access the current Inertia instance is the best way to ensure your
app remains compatible with all the platforms where Hono operates; but having to pass the context
object around only to access the Inertia instance may be a little cumbersome.

For cases like this, we provide an implementation that enables accessing the current Inertia
instance anywhere, as long as the Inertia middleware was executed first.

All you need to do is replace all your imports from `@antennajs/adapter-hono` to
`@antennajs/adapter-hono/async`. No other changes are necessary!

Now, you can access the current Inertia instance globally:

```js
import { Inertia, createInertiaMiddleware } from '@antennajs/adapter-hono/async'

function auth(ctx, next) {
    // Ensure user is correctly logged in, then...
    
    const user = ...
    
    Inertia.share('auth.user', user)
}

app.use(*, createInertiaMiddleware({ ... }), auth)

app.get('/', () => Inertia.render('Home'))
```

> [!IMPORTANT]
> This implementation makes use of [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html).
> Make sure your platform supports this feature.
> 
> **Cloudflare Workers**: Refer to [Cloudflare Workers' Documentation](https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/)
> to enable built-in compatibility of `AsyncLocalStorage`

> [!TIP]
> You can still access Inertia from Hono's context object if required.

## Server-side Rendering

This adapter allows you to define a function that can completely render your frontend application
in the server without the need for an extra process to be running only to perform this operation.

> [!NOTE]
> It should also be possible to use external rendering processes, the choice is yours.

```js
createInertiaMiddleware({
  ssr(page) {
    return createInertiaApp(...)
  },
  // ...
})
```

Here are some implementation examples for different frameworks:

<details>
<summary>Vue 3</summary>

```js
import { createInertiaApp } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'

createInertiaMiddleware({
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

createInertiaMiddleware({
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

createInertiaMiddleware({
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

### Client-side hydration

Instructions for official framework adapters can be found in [Inertia's SSR Documentation](https://inertiajs.com/server-side-rendering#client-side-hydration).
Otherwise, please consult your framework-specific adapter for more details.
