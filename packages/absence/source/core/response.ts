import UWS from "uWebSockets.js"
import { STATUS_CODES } from "http"

interface Payload {
  headers: Record<string, string>
  status: string
  body: string
}

export interface Response {
  setHeader(key: string, value: string): Response
  setStatus(status: number, message?: string): Response
  send(body?: string): void
}

export function createResponse(uwsResponse: UWS.HttpResponse): Response {
  const uwsStatus = { aborted: false }
  uwsResponse.onAborted(() => (uwsStatus.aborted = true))

  const response: Payload = {
    headers: {},
    body: "",
    status: `418 ${STATUS_CODES[418]}`,
  }

  return {
    setHeader(key: string, value: string) {
      response.headers[key] = value
      return this
    },

    setStatus(status: number, message = STATUS_CODES[status]) {
      response.status = `${status} ${message}`
      return this
    },

    send(data?: string) {
      if (data) response.body = data

      if (!uwsStatus.aborted)
        uwsResponse.cork(() => {
          for (const key in response.headers)
            uwsResponse.writeHeader(key, response.headers[key])

          uwsResponse.writeStatus(response.status)
          uwsResponse.end(response.body)
        })
    },
  }
}
