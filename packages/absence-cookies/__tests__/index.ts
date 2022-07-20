import Server from "absence"
import { cookie } from "../source"
import superagent from "superagent"

it("Should set and read cookies", async () => {
  const server = Server.create().use(cookie({ secret: "secret" }))
  const handler = jest.fn((context) => context.response.setStatus(200).send())

  server
    .route({ path: "/", method: "get" })
    .use((context) => {
      const views = parseInt(context.request.cookies["views"]!) || 0
      context.response.setCookie("views", `${views + 1}`)
    })
    .use(handler)

  const PORT = await server.listen(0)
  const agent = superagent.agent()

  await agent.get(`http://localhost:${PORT}`)
  await agent.get(`http://localhost:${PORT}`)

  agent.jar.setCookie("randomCookie=something")
  agent.jar.setCookie("randomCookie.fakesignatureeeks=something")

  await agent.get(`http://localhost:${PORT}`)
  await agent.get(`http://localhost:${PORT}`)
  await agent.get(`http://localhost:${PORT}`)

  expect(handler).toHaveBeenNthCalledWith(
    5,
    expect.objectContaining({
      request: expect.objectContaining({ cookies: { views: "4" } }),
    })
  )

  server.stop()
})
