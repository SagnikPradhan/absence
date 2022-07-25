import { InternalServer } from "./server"

import type {
  BaseContext,
  Handler,
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

export default class Server<C extends BaseContext> extends InternalServer<C> {
  static create = () => new Server<BaseContext>()

  static declareHandler = <C extends BaseContext, P extends Properties>(
    handler: Handler<C, P>
  ) => handler

  public use<P extends Properties | void>(
    handler: Handler<C, P>
  ): P extends Properties ? Server<ResolvedContext<C, P>> : Server<C>

  public use<N extends Exclude<string, keyof C>, P extends Properties>(
    name: N,
    handler: Handler<C, P>
  ): Server<ResolvedContext<C, P, N>>

  public use(
    a: string | Handler<C, Properties>,
    b?: Handler<C, Properties>
  ): any {
    const middleware: Middleware<C, Properties> =
      typeof a === "function"
        ? { name: null, handler: a }
        : { name: a, handler: b as Handler<C, Properties> }

    this.middlewares.push(middleware)

    return this
  }

  public route(o: string | { path: string; method: string }): RouteBuilder<C> {
    const matcher = typeof o === "object" ? o : { path: o, method: "all" }
    const middlewares: Middleware<C, Properties>[] = []

    this.router.add(matcher.method, matcher.path, middlewares)

    const builder: RouteBuilder<C> = {
      use<N extends Exclude<string, keyof C>, P extends Properties>(
        a: Handler<C, void> | N,
        b?: Handler<C, P>
      ) {
        const middleware: Middleware<C, P> =
          typeof a === "function"
            ? { name: null, handler: a }
            : { name: a as string, handler: b as Handler<C, P> }

        middlewares.push(middleware)

        return builder as RouteBuilder<ResolvedContext<C, P, N>>
      },
    }

    return builder
  }
}

export * from "./request"
export * from "./response"
export * from "./server"
export * from "./types"
