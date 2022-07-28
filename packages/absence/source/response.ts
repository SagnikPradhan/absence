import { STATUS_CODES } from "http"
import type { HttpResponse } from "uWebSockets.js"
import type { JsonValue } from "type-fest"

interface Payload {
  headers: [string, string][]
  status: string
  body?: string
}

export interface Response {
  status: { aborted: boolean; sent: boolean }
  setHeader(key: string, value: string): Response
  setStatus(status: number, message?: string): Response
  redirect(location: string, status?: number): void
  send(body?: string): void
  sendJson(body: JsonValue): void
}

export function createResponse(uwsResponse: HttpResponse): Response {
  const responseStatus = { aborted: false, sent: false }
  uwsResponse.onAborted(() => (responseStatus.aborted = true))

  const response: Payload = {
    headers: [],
    status: `200 ${STATUS_CODES[200]}`,
  }

  return {
    status: responseStatus,

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

    sendJson(data: JsonValue) {
      this.setHeader("Content-Type", "application/json").send(
        JSON.stringify(data)
      )
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
