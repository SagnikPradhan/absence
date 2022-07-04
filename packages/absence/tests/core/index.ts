import { createServer } from "$/core/server"

import tap from "tap"
import { fetch } from "undici"

tap.test("Should respond GET request", async (t) => {
  const server = createServer()

  server.route({ path: "/", method: "get" }).handle(async (context) => {
    return context.response
      .setStatus(200)
      .setHeader("Key", "Value")
      .send("Hello world")
  })

  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}`)
  const responseBody = await response.text()

  t.equal(response.status, 200, "Should be equal status")
  t.equal(response.statusText, "OK", "Should be equal status text")
  t.equal(response.headers.get("Key"), "Value", "Should be equal header")
  t.equal(responseBody, "Hello world", "Should be equal body")

  server.stop()
})

tap.test("Should respond 404 request", async (t) => {
  const server = createServer()
  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}`)

  t.equal(response.status, 404)
  t.equal(response.statusText, "Not Found")

  server.stop()
})

tap.test("Should inject plugins", async (t) => {
  t.plan(6)

  const server = createServer().use({
    name: "global",
    async initialize() {
      return { message: "Global" }
    },
  })

  server
    .route({ path: "/", method: "get" })
    .use({
      name: "local",
      async initialize() {
        return { message: "Local" }
      },
    })
    .handle(async (context) => {
      t.equal(context.global.message, "Global")
      t.equal(context.local.message, "Local")

      console.log("I am trying to be alive")

      return context.response.setStatus(200).send()
    })

  server.route({ path: "/a", method: "get" }).handle(async (context) => {
    // @ts-expect-error
    t.equal(context.local, undefined)
    t.equal(context.global.message, "Global")

    return context.response.setStatus(200).send()
  })

  const PORT = await server.listen(0)
  const responseA = await fetch(`http://localhost:${PORT}`)
  const responseB = await fetch(`http://localhost:${PORT}/a`)

  t.equal(responseA.status, 200)
  t.equal(responseB.status, 200)

  server.stop()
})

tap.test("Should handle errors", async (t) => {
  t.plan(2)

  const server = createServer().useErrorHandler(async (error) => {
    t.equal(error.message, "Dumb error")
  })

  server.route({ path: "/", method: "get" }).handle(async () => {
    throw new Error("Dumb error")
  })

  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}`)

  t.equal(response.status, 500)

  server.stop()
})

// tap.test("Should throw error for multiple servers on same port", async (t) => {
//   const server = createServer()

//   await server.listen(4000)
//   await server
//     .listen(4000)
//     .then(() => t.fail())
//     .catch((error) => t.ok(error))

//   server.stop()
// })
