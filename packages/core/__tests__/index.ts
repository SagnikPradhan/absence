import { createServer } from "$/core/server"

import { fetch } from "undici"

test("Should respond GET request", async () => {
  const server = createServer()

  server.route({ path: "/", method: "get" }).use(async (context) => {
    return context.response
      .setStatus(200)
      .setHeader("Key", "Value")
      .send("Hello world")
  })

  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}`)
  const responseBody = await response.text()

  expect(response.status).toEqual(200)
  expect(response.statusText).toEqual("OK")
  expect(response.headers.get("Key")).toEqual("Value")
  expect(responseBody).toEqual("Hello world")

  server.stop()
})

test("Should respond 404 request", async () => {
  const server = createServer()
  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}`)

  expect(response.status).toEqual(404)
  expect(response.statusText).toEqual("Not Found")

  server.stop()
})

test("Should inject plugins", async () => {
  const server = createServer().use("global", { message: "Global" })

  server
    .route({ path: "/", method: "get" })
    .use("local", { message: "Local" })
    .use(async (context) => {
      expect(context.global.message).toEqual("Global")
      expect(context.local.message).toEqual("Local")

      return context.response.setStatus(200).send()
    })

  server.route({ path: "/a", method: "get" }).use(async (context) => {
    // @ts-expect-error
    expect(context.local).toEqual(undefined)
    expect(context.global.message).toEqual("Global")

    return context.response.setStatus(200).send()
  })

  const PORT = await server.listen(0)
  const responseA = await fetch(`http://localhost:${PORT}`)
  const responseB = await fetch(`http://localhost:${PORT}/a`)

  expect(responseA.status).toEqual(200)
  expect(responseB.status).toEqual(200)

  server.stop()
})
