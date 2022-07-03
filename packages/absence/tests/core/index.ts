import tap from "tap"
import { fetch } from "undici"

import { createServer } from "$/core/server"

tap.test("GET request", async (t) => {
  const server = createServer()

  server.route({
    path: "/",
    method: "get",

    handler(context) {
      return context.response.setStatus(200).send("Hello world")
    },
  })

  await server.listen(3000)

  const response = await fetch("http://localhost:3000")
  const responseBody = await response.text()

  t.equal(responseBody, "Hello world")

  server.stop()
})
