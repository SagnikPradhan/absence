import { Router } from ".."

describe("Router", () => {
  it("Should get root route", () => {
    const router = new Router()
    router.add("any", "/", ["a"])

    expect(router.find("any", "/")).toEqual({ parameters: {}, handles: ["a"] })
  })

  it("Should get nested route", () => {
    const router = new Router()
    router.add("any", "/", ["parent"])
    router.add("any", "/nested", ["child"])

    expect(router.find("any", "/nested")).toEqual({
      parameters: {},
      handles: ["child"],
    })

    expect(router.find("any", "/")).toEqual({
      parameters: {},
      handles: ["parent"],
    })
  })

  it("Should read named parameters", () => {
    const router = new Router()
    router.add("any", "/:parameter", ["a"])

    expect(router.find("any", "/b")).toEqual({
      parameters: { parameter: "b" },
      handles: ["a"],
    })
  })

  it("Should read multiple named parameters", () => {
    const router = new Router()
    router.add("any", "/:a/something/*b", ["b"])

    expect(router.find("any", "/1/something/2/hey/hello")).toEqual({
      parameters: { a: "1", b: "2/hey/hello" },
      handles: ["b"],
    })
  })

  it("Should get routes added without order", () => {
    const router = new Router()
    router.add("any", "/:a/something/home", ["a"])
    router.add("any", "/admin/something/home", ["b"])

    expect(router.find("any", "/1/something/home")).toEqual({
      parameters: { a: "1" },
      handles: ["a"],
    })

    expect(router.find("any", "/admin/something/home")).toEqual({
      parameters: {},
      handles: ["b"],
    })
  })

  it("Should get nested routes with parameters", () => {
    const router = new Router()
    router.add("any", "/a/:b/c/d/e", ["b"])
    router.add("any", "/a/:b/c/d", ["a"])

    expect(router.find("any", "/a/1/c/d")).toEqual({
      parameters: { b: "1" },
      handles: ["a"],
    })

    expect(router.find("any", "/a/2/c/d/e")).toEqual({
      parameters: { b: "2" },
      handles: ["b"],
    })
  })

  it("Should throw for duplicate routes and parameters", () => {
    const router = new Router()
    router.add("any", "/:something", [])
    router.add("any", "/a", [])

    expect(() => {
      router.add("any", "/a", [])
    }).toThrow("Duplicate route")

    expect(() => {
      router.add("any", "/:somethingElse", [])
    }).toThrow("Duplicate parameter")
  })

  it("Should throw for route after catchall", () => {
    const router = new Router()

    expect(() => router.add("any", "/a/*c/somethingElse", [])).toThrow(
      "Route after catchall"
    )
  })
})
