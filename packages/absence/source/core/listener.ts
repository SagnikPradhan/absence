import UWS from "uWebSockets.js"

import { Routes } from "./server"
import { HTTPMethod, HTTPMethods } from "./types"
import { createPartialRequest, Request } from "./request"
import { createResponse, Response } from "./response"

interface RequestListenerOptions {
  routes: Routes
}

export interface Context {
  request: Request
  response: Response
}

function isAllowedHTTPMethod(method: string): method is HTTPMethod {
  for (let index = 0; index < HTTPMethods.length; index++)
    if (HTTPMethods[index] === method) return true
  return false
}

export function requestListener({ routes }: RequestListenerOptions) {
  return async (uwsResponse: UWS.HttpResponse, uwsRequest: UWS.HttpRequest) => {
    const response = createResponse(uwsResponse)
    const request = await createPartialRequest(uwsResponse, uwsRequest)

    if (!isAllowedHTTPMethod(request.method))
      return response.setStatus(405).send()

    const route = routes[request.method].lookup(request.path)
    if (!route) return response.setStatus(404).send()

    const context: Context = {
      request: { ...request, parameters: route.parameters },
      response,
    }

    await route.data.handler(context)
  }
}
