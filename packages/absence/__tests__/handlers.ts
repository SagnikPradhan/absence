import superagent from "superagent"
import { createApp, declareHandler } from "../source"

test("Should inject anonymous handler properties", async () => {
  const injectProperties = declareHandler(() => ({
    context: { hello: "world" },
    request: { helloRequest: "world" },
    response: { helloResponse: "world" },
  }))

  const handler = jest.fn((context) => context.response.setStatus(200).send())
  const server = createApp().use(injectProperties)

  server.route({ path: "/", method: "get" }).use(handler)

  const PORT = await server.listen(0)

  await superagent(`http://localhost:${PORT}`).send()

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      hello: "world",
      request: expect.objectContaining({ helloRequest: "world" }),
      response: expect.objectContaining({ helloResponse: "world" }),
    })
  )

  server.stop()
})

test("Should inject handler declared properties", async () => {
  const createMessageHandler = (message: string) =>
    declareHandler(() => ({
      context: { message },
    }))

  const server = createApp().use("global", createMessageHandler("Global"))
  const handler = jest.fn((context) => context.response.setStatus(200).send())

  server
    .route({ path: "/", method: "get" })
    .use("local", createMessageHandler("Local"))
    .use(handler)

  server.route({ path: "/a", method: "get" }).use(handler)

  const PORT = await server.listen(0)
  const responseA = await superagent(`http://localhost:${PORT}`).send()
  const responseB = await superagent(`http://localhost:${PORT}/a`).send()

  expect(responseA.status).toEqual(200)
  expect(responseB.status).toEqual(200)

  expect(handler).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      local: { message: "Local" },
      global: { message: "Global" },
    })
  )

  expect(handler).toHaveBeenNthCalledWith(
    2,
    expect.not.objectContaining({
      local: { message: "Local" },
    })
  )

  server.stop()
})
