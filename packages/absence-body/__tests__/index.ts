import { createApp } from "absence"
import superagent from "superagent"
import { body } from "../source"

it("Should parse json", async () => {
  const server = createApp().use(body({ json: true }))
  const handler = jest.fn((context) => context.response.setStatus(201).send())

  server.route({ path: "/", method: "post" }).use(handler)

  const PORT = await server.listen(0)

  await superagent.post(`http://localhost:${PORT}`).send({ hello: "world" })

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      request: expect.objectContaining({ parsedBody: { hello: "world" } }),
    })
  )

  server.stop()
})

it("Should parse urlencoded", async () => {
  const server = createApp().use(body({ urlencoded: true }))
  const handler = jest.fn((context) => context.response.setStatus(201).send())

  server.route({ path: "/", method: "post" }).use(handler)

  const PORT = await server.listen(0)

  await superagent
    .post(`http://localhost:${PORT}`)
    .type("form")
    .send({ hello: "world" })

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      request: expect.objectContaining({ parsedBody: { hello: "world" } }),
    })
  )

  server.stop()
})

it("Should ignore disabled parsers", async () => {
  const server = createApp().use(body({}))
  const handler = jest.fn((context) => context.response.setStatus(201).send())

  server.route({ path: "/", method: "post" }).use(handler)

  const PORT = await server.listen(0)

  await superagent.post(`http://localhost:${PORT}`).send({ hello: "world" })

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      request: expect.objectContaining({ parsedBody: null }),
    })
  )

  server.stop()
})
