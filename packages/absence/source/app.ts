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

interface RouteBuilder<Context extends BaseContext> {
  use<P extends Properties | void>(
    handler: Handler<Context, P>
  ): P extends Properties
    ? RouteBuilder<ResolvedContext<Context, P>>
    : RouteBuilder<Context>

  use<N extends Exclude<string, keyof Context>, P extends Properties>(
    name: N,
    handler: Handler<Context, P>
  ): RouteBuilder<ResolvedContext<Context, P, N>>
}

export interface App<C extends BaseContext> {
  use<P extends Properties | void>(
    handler: Handler<C, P>
  ): P extends Properties ? App<ResolvedContext<C, P>> : App<C>

  use<N extends Exclude<string, keyof C>, P extends Properties>(
    name: N,
    handler: Handler<C, P>
  ): App<ResolvedContext<C, P, N>>

  route<Path extends string>(
    matcher: Path | { path: Path; method: HTTPMethods }
  ): RouteBuilder<C & BaseContext<GetParameters<Path>>>

  listen(port: number): Promise<number>
  stop(): void
}

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
          RouteBuilder<BaseContext<GetParameters<P>>>,
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

export function declareHandler<C extends BaseContext, P extends Properties>(
  handler: Handler<C, P>
) {
  return handler
}
