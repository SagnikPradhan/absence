import superagent from "superagent"
import { fetch } from "undici"
import { createApp } from "../source"

test("Should respond GET request", async () => {
  const server = createApp()

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

test("Should infer parameters", async () => {
  const server = createApp()

  server
    .route({ path: "/cats/:cat/query/*query", method: "get" })
    .use(async (context) => {
      const cat = context.request.parameters.cat
      const query = context.request.parameters.query

      return context.response.send(`Cat is: ${cat}, Query is: ${query}`)
    })

  const PORT = await server.listen(0)
  const response = await superagent(
    `http://localhost:${PORT}/cats/tommy/query/food/noon`
  ).send()

  expect(response.text).toEqual("Cat is: tommy, Query is: food/noon")

  server.stop()
})

test("Should respond 404 request", async () => {
  const server = createApp()
  const PORT = await server.listen(0)
  const response = await fetch(`http://localhost:${PORT}`)

  expect(response.status).toEqual(404)
  expect(response.statusText).toEqual("Not Found")

  server.stop()
})

test("Should redirect", async () => {
  const server = createApp()

  server
    .route({ path: "/redirect", method: "get" })
    .use((context) => context.response.redirect("/"))

  server
    .route({ path: "/", method: "get" })
    .use((context) => context.response.send("You are on root"))

  const PORT = await server.listen(0)
  const response = await superagent(`http://localhost:${PORT}/redirect`)
    .redirects(1)
    .send()

  expect(response.text).toEqual("You are on root")

  server.stop()
})

test("Should send JSON response", async () => {
  const server = createApp()

  server
    .route({ path: "/", method: "get" })
    .use((context) => context.response.sendJson({ hello: "world" }))

  const PORT = await server.listen(0)
  const response = await superagent(`http://localhost:${PORT}`).send()

  expect(response.body).toEqual({ hello: "world" })

  server.stop()
})
