import type { HttpRequest, HttpResponse } from "uWebSockets.js"

export interface Request {
  path: string
  method: string
  queries: Record<string, string>
  headers: Record<string, string>
  parameters: Record<string, string>
  body: string
}

function getHeaders(request: HttpRequest) {
  const headers: Record<string, string> = {}
  request.forEach((key, value) => (headers[key] = value))
  return headers
}

function getBody(response: HttpResponse) {
  return new Promise<string>((resolve) => {
    const body: Buffer[] = []

    response.onData((chunk, isLast) => {
      body.push(Buffer.from(chunk))
      if (isLast) resolve(Buffer.concat(body).toString())
    })
  })
}

function getQueries(request: HttpRequest) {
  return Object.fromEntries(new URLSearchParams(request.getQuery()).entries())
}

export async function createRequest({
  response,
  request,
  parameters,
}: {
  response: HttpResponse
  request: HttpRequest
  parameters: Record<string, string>
}): Promise<Request> {
  const path = request.getUrl()
  const method = request.getMethod()
  const queries = getQueries(request)
  const headers = getHeaders(request)
  const body = await getBody(response)

  const parsedRequest = { path, method, queries, parameters, headers, body }

  Object.defineProperties(parsedRequest, {
    path: { configurable: false, writable: false },
    method: { configurable: false, writable: false },
    queries: { configurable: false, writable: false },
    parameters: { configurable: false, writable: false },
    headers: { configurable: false, writable: false },
    body: { configurable: false, writable: false },
  })

  return parsedRequest
}
