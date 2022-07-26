import Server from "../source"
import { fetch } from "undici"

test("Should respond GET request", async () => {
  const server = Server.create()

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
  const server = Server.create()
  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}`)

  expect(response.status).toEqual(404)
  expect(response.statusText).toEqual("Not Found")

  server.stop()
})

test("Should redirect", async () => {
  const server = Server.create()

  server
    .route({ path: "/redirect", method: "get" })
    .use((context) => context.response.redirect("/"))

  server
    .route({ path: "/", method: "get" })
    .use((context) => context.response.send("You are on root"))

  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}/redirect`)

  expect(response.redirected).toEqual(true)
  expect(await response.text()).toEqual("You are on root")

  server.stop()
})
