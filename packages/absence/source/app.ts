import { Router } from "@absence/router"
import { createServer } from "./server"

import type {
  BaseContext,
  GetParameters,
  Handler,
  HTTPMethods,
  Middleware,
  Properties,
  ResolvedContext,
} from "./types"

/** A route, handlers added are scoped under this route */
interface Route<Context extends BaseContext> {
  /** Add a handler on the current route */
  use<P extends Properties | void>(
    handler: Handler<Context, P>
  ): P extends Properties ? Route<ResolvedContext<Context, P>> : Route<Context>

  /** Add a named handler on the current route */
  use<N extends Exclude<string, keyof Context>, P extends Properties>(
    name: N,
    handler: Handler<Context, P>
  ): Route<ResolvedContext<Context, P, N>>
}

/** Base absence app, use this to add handlers and routes */
export interface App<C extends BaseContext> {
  /** Add a handler */
  use<P extends Properties | void>(
    handler: Handler<C, P>
  ): P extends Properties ? App<ResolvedContext<C, P>> : App<C>

  /** Add a named handler, named handlers get scoped with their name in contexts */
  use<N extends Exclude<string, keyof C>, P extends Properties>(
    name: N,
    handler: Handler<C, P>
  ): App<ResolvedContext<C, P, N>>

  /**
   * Create a route, handlers added after get scoped to this specific route.
   * Using just a string as the argument would select every HTTP method
   */
  route<Path extends string>(
    matcher: Path | { path: Path; method: HTTPMethods }
  ): Route<C & BaseContext<GetParameters<Path>>>

  /**
   * Start listening on specified port. Use port 0 to auto select. Returns a
   * promise with the port it's listening on
   */
  listen(port: number): Promise<number>

  /** Stops the server closing the sockets */
  stop(): void
}

/** Create a new absence app */
export function createApp(): App<BaseContext> {
  const router = new Router()
  const middlewares: Middleware[] = []

  const server = createServer({
    onError: (error) => console.error(error),

    getRouteDetails: ({ method, path }) => {
      const route = router.find(method, path) || router.find("all", path)

      if (route)
        return {
          parameters: route.parameters,
          middleware: [...middlewares, ...route.handles],
        }
      else return null
    },
  })

  return {
    stop: server.stop,
    listen: server.listen,
    use: createUse(middlewares),

    route: <P extends string>(o: P | { path: P; method: HTTPMethods }) => {
      const matcher = typeof o === "object" ? o : { path: o, method: "all" }
      const middlewares: Middleware[] = []
      router.add(matcher.method, matcher.path, middlewares)

      return {
        use: createUse<
          Route<BaseContext<GetParameters<P>>>,
          BaseContext<GetParameters<P>>
        >(middlewares),
      }
    },
  }
}

function createUse<O, Context extends BaseContext>(
  middlewares: Middleware<Context, Properties>[]
) {
  return function use<
    N extends Exclude<string, keyof Context>,
    P extends Properties
  >(this: O, a: Handler<Context, void> | N, b?: Handler<Context, P>) {
    const middleware: Middleware<Context, P> =
      typeof a === "function"
        ? { name: null, handler: a }
        : { name: a as string, handler: b as Handler<Context, P> }

    middlewares.push(middleware)

    return this
  }
}

/**
 * Declare a handler to be use elsewhere. Handlers are really request handlers,
 * that take in context and if required return properties to be injected at
 * various places.
 */
export function declareHandler<C extends BaseContext, P extends Properties>(
  handler: Handler<C, P>
) {
  return handler
}
