import { STATUS_CODES } from "http"
import type UWS from "uWebSockets.js"
import type { Response } from "./server"

interface Payload {
  headers: Record<string, string>
  status: string
  body: string
}

export function createResponse(uwsResponse: UWS.HttpResponse): Response {
  const responseStatus = { aborted: false, sent: false }
  uwsResponse.onAborted(() => (responseStatus.aborted = true))

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

    redirect(location, status = 307) {
      this.setHeader("Location", location).setStatus(status).send()
    },

    send(data?: string) {
      responseStatus.sent = true

      if (data) response.body = data

      if (!responseStatus.aborted)
        uwsResponse.cork(() => {
          for (const key in response.headers)
            uwsResponse.writeHeader(key, response.headers[key]!)

          uwsResponse.writeStatus(response.status)
          uwsResponse.end(response.body)
        })
    },
  }
}
