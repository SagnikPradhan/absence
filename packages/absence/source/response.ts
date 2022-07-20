import { STATUS_CODES } from "http"
import type { HttpResponse } from "uWebSockets.js"

interface Payload {
  headers: [string, string][]
  status: string
  body?: string
}

export interface Response {
  setHeader(key: string, value: string): Response
  setStatus(status: number, message?: string): Response
  redirect(location: string, status?: number): void
  send(body?: string): void
}

export function createResponse(uwsResponse: HttpResponse): Response {
  const responseStatus = { aborted: false, sent: false }
  uwsResponse.onAborted(() => (responseStatus.aborted = true))

  const response: Payload = {
    headers: [],
    status: `418 ${STATUS_CODES[418]}`,
  }

  return {
    setHeader(key: string, value: string) {
      response.headers.push([key, value])
      return this
    },

    setStatus(status: number, message = STATUS_CODES[status]) {
      response.status = `${status} ${message}`
      return this
    },

    redirect(location, status = 307) {
      this.setHeader("Location", location).setStatus(status).send()
    },

    send(data?: string) {
      responseStatus.sent = true

      if (data) response.body = data

      if (!responseStatus.aborted)
        uwsResponse.cork(() => {
          uwsResponse.writeStatus(response.status)

          for (const [key, value] of response.headers)
            uwsResponse.writeHeader(key, value)

          uwsResponse.end(response.body)
        })
    },
  }
}
