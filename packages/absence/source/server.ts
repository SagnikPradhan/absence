import {
  App,
  HttpRequest,
  HttpResponse,
  us_listen_socket_close,
  us_socket,
  us_socket_local_port,
} from "uWebSockets.js"

import { createRequest } from "./request"
import { createResponse } from "./response"

import type { BaseContext, Middleware } from "./types"
import {
  addReadonlyProperty,
  createObjectWithReadonlyProperties,
} from "./utilities"

export interface Server {
  listen(port: number): Promise<number>
  stop(): void
}

interface ServerOptions {
  onError: (error: Error) => void
  getRouteDetails: (matcher: Matcher) => RouteDetails | null
}

interface Matcher {
  path: string
  method: string
}

interface RouteDetails {
  parameters: Record<string, string>
  middleware: Middleware[]
}

export function createServer({
  onError,
  getRouteDetails,
}: ServerOptions): Server {
  const server = App()
  const sockets: Set<us_socket> = new Set()

  server.any("/*", (response, request) => {
    const route = getRouteDetails({
      path: request.getUrl(),
      method: request.getMethod(),
    })

    onRequest({ response, request, route }).catch(onError)
  })

  return {
    listen(port) {
      return new Promise<number>((resolve, reject) => {
        server.listen(port, 1, (socket) => {
          if (!socket) return reject(new Error(`Could not connect to ${port}`))
          sockets.add(socket)
          return resolve(us_socket_local_port(socket))
        })
      })
    },

    stop() {
      // TODO: Support stopping specific socket
      for (const socket of sockets) us_listen_socket_close(socket)
    },
  }
}

interface RequestListenerOptions {
  response: HttpResponse
  request: HttpRequest
  route: RouteDetails | null
}

async function onRequest(options: RequestListenerOptions) {
  const response = createResponse(options.response)
  const route = options.route

  if (!route) return response.setStatus(404).send()

  const request = await createRequest({
    response: options.response,
    request: options.request,
    parameters: route.parameters,
  })

  return executeMiddlewares(
    createObjectWithReadonlyProperties({ request, response }),
    route.middleware
  )
}

async function executeMiddlewares(
  context: BaseContext,
  middleware: Middleware[]
) {
  for (const { name, handler } of middleware) {
    if (context.response.status.sent) break

    const value = await handler(context)

    function addContextProperty<A, B extends {}>(object: A, value: B) {
      return name
        ? addReadonlyProperty(object, name, value)
        : Object.assign(object, createObjectWithReadonlyProperties(value))
    }

    if (value) {
      if (value.context) addContextProperty(context, value.context)
      if (value.request) addContextProperty(context.request, value.request)
      if (value.response) addContextProperty(context.response, value.response)
    }
  }
}
