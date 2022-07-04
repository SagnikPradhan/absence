import * as UWS from "uWebSockets.js"

import { BaseContext, Plugin, Response, Route, RouteDetails, Server } from "."
import { Tree } from "../helpers/tree"
import { extractRequest, normalizePath } from "./request"
import { createResponse } from "./response"

function defaultErrorHandler(error: Error) {
  console.error(error)
  if (process.env.NODE_ENV === "production") process.exit(1)
}

export function createServer<C extends BaseContext = BaseContext>(): Server<C> {
  const sockets: UWS.us_listen_socket[] = []
  const plugins: Plugin[] = []
  const routes: Record<string, Tree<RouteDetails<C>>> = {}
  let userErrorHandler: null | ((error: Error) => Promise<void>) = null

  function handleError(error: Error, response?: Response) {
    if (response) response.setStatus(500).send()
    if (userErrorHandler) userErrorHandler(error).catch(defaultErrorHandler)
    else defaultErrorHandler(error)
  }

  return {
    use<N extends string, P extends {}>(plugin: Plugin<N, C, P>) {
      plugins.push(plugin)
      return this as Server<{ [name in N]: P } & C>
    },

    route(o) {
      const options = typeof o === "object" ? o : { path: o, method: "all" }
      const plugins: Plugin[] = []

      return {
        use<N extends string, P extends {}>(plugin: Plugin<N, C, P>) {
          plugins.push(plugin)
          return this as Route<{ [name in N]: P } & C>
        },

        handle(handler) {
          if (!routes[options.method]) routes[options.method] = new Tree()

          routes[options.method].add(normalizePath(options.path), {
            plugins,
            handler,
            ...options,
          })
        },
      }
    },

    useErrorHandler(handler) {
      userErrorHandler = handler
      return this
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

            const route =
              routes[request.method]?.lookup(request.path) ||
              routes.all?.lookup(request.path)

            if (!route) return response.setStatus(404).send()

            const context: BaseContext & Record<string, unknown> = {
              request: { ...request, parameters: route.parameters },
              response,
            }

            for (const plugin of [...plugins, ...route.data.plugins])
              if (plugin.initialize) {
                const data = await plugin.initialize()
                if (data) context[plugin.name] = data
              }

            route.data
              .handler(context as C)
              .catch((error) => handleError(error, response))
          }
        )

        server.listen(port, 1, (socket) => {
          if (socket) {
            sockets.push(socket)
            resolve(UWS.us_socket_local_port(socket))
          } else {
            reject(new Error(`Could not connect to ${port}`))
          }
        })
      })
    },

    stop() {
      for (const socket of sockets) UWS.us_listen_socket_close(socket)
      sockets.length = 0
    },
  }
}
