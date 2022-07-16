import * as UWS from "uWebSockets.js"
import { Router } from "@absence/router"

import { extractRequest } from "./request"
import { createResponse } from "./response"

export interface Server<Context extends {} = {}> {
  route(options: string | RouteMatcher): MiddlewareChain<Context>

  use(middleware: Middleware<Context>): Server<Context>
  use<Property extends Exclude<string, keyof Context>, Value extends {}>(
    name: Property,
    middleware: Middleware<Context, Value> | Value
  ): Server<Context & { [K in Property]: Value }>

  listen(port: number): Promise<number>
  stop(): void
}

interface Handle<C> {
  name?: string
  handle: Middleware<C, unknown> | unknown
}

interface MiddlewareChain<Context extends {}> {
  use(middleware: Middleware<Context>): MiddlewareChain<Context>
  use<Property extends Exclude<string, keyof Context>, Value extends {}>(
    name: Property,
    middleware: Middleware<Context, Value> | Value
  ): MiddlewareChain<Context & { [K in Property]: Value }>
}

export type Middleware<Context extends {}, Value = unknown> = (
  context: Context & BaseContext
) => Promise<void | Value>

export interface BaseContext {
  request: Request
  response: Response
}

export interface Request {
  path: string
  method: string
  queries: Record<string, string>
  headers: Record<string, string>
  parameters: Record<string, string>
  body: string
}

export interface Response {
  setHeader(key: string, value: string): Response
  setStatus(status: number, message?: string): Response
  redirect(location: string, status?: number): void
  send(body?: string): void
}

interface RouteMatcher {
  path: string
  method: string
}

export function createServer<C extends {} = {}>(): Server<C> {
  const sockets: UWS.us_listen_socket[] = []
  const router = new Router()
  const globalHandles: Handle<C>[] = []

  const server: Server<C> = {
    use<P extends Exclude<string, keyof C>, V extends {}>(
      a: Middleware<C, P> | string,
      b?: Middleware<C, P> | V
    ) {
      const handle: Handle<C> =
        typeof a === "function"
          ? { handle: a }
          : { name: a as string, handle: b as Middleware<C, P> | V }

      globalHandles.push(handle)
      return server as Server<C & { [K in P]: V }>
    },

    route(o: string | RouteMatcher): MiddlewareChain<C> {
      const matcher = typeof o === "object" ? o : { path: o, method: "all" }
      const middlewares: Handle<C>[] = []

      router.add(matcher.method, matcher.path, middlewares)

      const middlewareChain: MiddlewareChain<C> = {
        use<P extends Exclude<string, keyof C>, V extends {}>(
          a: Middleware<C, P> | string,
          b?: Middleware<C, P> | V
        ) {
          const handle: Handle<C> =
            typeof a === "function"
              ? { handle: a }
              : { name: a as string, handle: b as Middleware<C, P> | V }

          middlewares.push(handle)
          return middlewareChain as MiddlewareChain<{ [name in P]: V } & C>
        },
      }

      return middlewareChain
    },

    listen(port) {
      return new Promise<number>((resolve, reject) => {
        const server = UWS.App()

        server.any(
          "/*",
          async (
            uwsResponse: UWS.HttpResponse,
            uwsRequest: UWS.HttpRequest
          ) => {
            const response = createResponse(uwsResponse)
            const request = await extractRequest(uwsResponse, uwsRequest)

            const route = router.find(request.method, request.path)
            if (!route) return response.setStatus(404).send()

            const context = {
              request: { ...request, parameters: route.parameters },
              response,
            } as C & BaseContext

            const handles: Handle<C>[] = [...globalHandles, ...route.handles]

            for (const handle of handles) {
              const value =
                typeof handle.handle === "function"
                  ? await handle.handle(context)
                  : handle.handle

              if (typeof handle.name === "string")
                Object.defineProperty(context, handle.name, {
                  configurable: false,
                  writable: false,
                  enumerable: true,
                  value: Object.freeze(value),
                })
            }
          }
        )

        server.listen(port, 1, (socket) => {
          if (socket) {
            sockets.push(socket)
            return resolve(UWS.us_socket_local_port(socket))
          }

          reject(new Error(`Could not connect to ${port}`))
        })
      })
    },

    stop() {
      for (const socket of sockets) UWS.us_listen_socket_close(socket)
      sockets.length = 0
    },
  }

  return server
}
