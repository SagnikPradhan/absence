import UWS from "uWebSockets.js"

const MULTI_SLASH_REGEX = /\/+|(?<!\/)($|^)/g

function normalize(path: string) {
  return path.replace(MULTI_SLASH_REGEX, "/")
}

function getHeaders(request: UWS.HttpRequest) {
  const headers: Record<string, string> = {}
  request.forEach((key, value) => (headers[key] = value))
  return headers
}

function getBody(response: UWS.HttpResponse) {
  return new Promise<string>((resolve) => {
    const body: Buffer[] = []

    response.onData((chunk, isLast) => {
      body.push(Buffer.from(chunk))
      if (isLast) resolve(Buffer.concat(body).toString())
    })
  })
}

function getQueries(request: UWS.HttpRequest) {
  return Object.fromEntries(new URLSearchParams(request.getQuery()).entries())
}

export interface Request {
  path: string
  method: string
  queries: Record<string, string>
  headers: Record<string, string>
  parameters: Record<string, string>
  body: string
}

export async function createPartialRequest(
  response: UWS.HttpResponse,
  request: UWS.HttpRequest
): Promise<Omit<Request, "parameters">> {
  const path = normalize(request.getUrl())
  const method = request.getMethod()
  const queries = getQueries(request)
  const headers = getHeaders(request)
  const body = await getBody(response)

  return { path, method, queries, headers, body }
}
