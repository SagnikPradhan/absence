import Server from "absence"
import type { JsonObject } from "type-fest"

export interface BodyOptions {
  json?: boolean
  urlencoded?: boolean
}

export function body({ json, urlencoded }: BodyOptions) {
  return Server.declareHandler(async ({ request }) => {
    const type = request.headers["content-type"]?.split(";")[0]

    if (json && type === "application/json")
      return { request: { parsedBody: JSON.parse(request.body) as JsonObject } }

    if (urlencoded && type === "application/x-www-form-urlencoded")
      return {
        request: {
          parsedBody: Object.fromEntries(
            new URLSearchParams(request.body).entries()
          ) as JsonObject,
        },
      }

    return { request: { parsedBody: null } }
  })
}
