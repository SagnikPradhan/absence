import * as UWS from "uWebSockets.js"
import { Tree } from "$/helpers/tree"
import { HTTPMethod, HTTPMethods } from "./types"
import { Context, requestListener } from "./listener"

export interface Route {
  handler(context: Context): Promise<void> | void
}

export interface RouteOptions extends Route {
  path: string
  method: HTTPMethod
}

export type Routes = Record<HTTPMethod, Tree<Route>>

export interface Server {
  route(options: RouteOptions): Server
  listen(port: number): Promise<void>
  stop(): void
}

export function createServer(): Server {
  const sockets = new Set<UWS.us_listen_socket>()

  const routes = Object.fromEntries(
    HTTPMethods.map((method) => [method, new Tree()])
  ) as Routes

  return {
    route(options) {
      routes[options.method].add(options.path, { handler: options.handler })
      return this
    },

    listen(port) {
      return new Promise<void>((resolve) => {
        const server = UWS.App()

        server.any("/*", requestListener({ routes }))

        server.listen(port, (socket: UWS.us_listen_socket) => {
          sockets.add(socket)
          resolve()
        })
      })
    },

    stop() {
      for (const socket of sockets.values()) UWS.us_listen_socket_close(socket)
      sockets.clear()
    },
  }
}
