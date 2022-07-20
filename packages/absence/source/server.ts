import { Router } from "@absence/router"

import {
  App,
  HttpRequest,
  HttpResponse,
  TemplatedApp,
  us_listen_socket_close,
  us_socket,
  us_socket_local_port,
} from "uWebSockets.js"

import { createRequest } from "./request"
import { createResponse } from "./response"
import type { BaseContext, Middleware, Properties } from "./types"

export class InternalServer<Context extends BaseContext> {
  private readonly app: TemplatedApp
  private readonly sockets: Set<us_socket>

  protected readonly router: Router
  protected readonly middlewares: Middleware<Context, Properties>[]

  constructor() {
    this.app = App()
    this.sockets = new Set()
    this.router = new Router()
    this.middlewares = []

    this.app.any("/*", (httpResponse, httpRequest) =>
      this.requestListener(httpResponse, httpRequest)
    )
  }

  public listen(port: number) {
    return new Promise<number>((resolve, reject) => {
      this.app.listen(port, 1, (socket) => {
        if (socket) {
          this.sockets.add(socket)
          return resolve(us_socket_local_port(socket))
        }

        reject(new Error(`Could not connect to ${port}`))
      })
    })
  }

  public stop() {
    for (const socket of this.sockets) us_listen_socket_close(socket)
    this.sockets.clear()
  }

  private async requestListener(
    httpResponse: HttpResponse,
    httpRequest: HttpRequest
  ) {
    const response = createResponse(httpResponse)

    const route = this.router.find(
      httpRequest.getMethod(),
      httpRequest.getUrl()
    )

    if (!route) return response.setStatus(404).send()

    const request = await createRequest({
      response: httpResponse,
      request: httpRequest,
      parameters: route.parameters,
    })

    const context = { request, response } as Context

    const middlewares: Middleware<Context, Properties>[] = [
      ...this.middlewares,
      ...route.handles,
    ]

    for (const middleware of middlewares)
      await this.executeMiddleware(context, middleware)
  }

  private async executeMiddleware(
    context: Context,
    middleware: Middleware<Context, Properties>
  ) {
    const value = await middleware.handler(context)

    if (value) {
      if ("context" in value)
        addReadOnlyProperty(context, value.context, middleware.name)

      if ("request" in value)
        addReadOnlyProperty(context.request, value.request, middleware.name)

      if ("response" in value)
        addReadOnlyProperty(context.response, value.response, middleware.name)
    }
  }
}

function addReadOnlyProperty(
  target: object,
  value: object,
  prefix: string | null
) {
  if (prefix)
    Object.defineProperty(target, prefix, {
      value: Object.freeze(value),
      configurable: false,
      enumerable: true,
      writable: false,
    })
  else
    for (const [k, v] of Object.entries(value))
      Object.defineProperty(target, k, {
        value: Object.freeze(v),
        configurable: false,
        enumerable: true,
        writable: false,
      })
}
