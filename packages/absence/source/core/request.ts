import UWS from "uWebSockets.js"

const MULTI_SLASH_REGEX = /\/+|(?<!\/)($|^)/g

export function normalizePath(path: string) {
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

export async function extractRequest(
  response: UWS.HttpResponse,
  request: UWS.HttpRequest
) {
  const path = normalizePath(request.getUrl())
  const method = request.getMethod()
  const queries = getQueries(request)
  const headers = getHeaders(request)
  const body = await getBody(response)

  return { path, method, queries, headers, body }
}
