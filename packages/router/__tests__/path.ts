import { cleanPath, findCommon } from ".."

describe("Path common", () => {
  it("Should find common prefixes", () => {
    expect(findCommon("/a/b", "/a/c")).toEqual({
      common: "/a/",
      targetExcess: "b",
      nodeExcess: "c",
    })
  })

  it("Should find common prefixes with parameters", () => {
    expect(findCommon("/a/:b", "/a/c")).toEqual({
      common: "/a/",
      targetExcess: ":b",
      nodeExcess: "c",
    })
  })
})

describe("Path clean", () => {
  it("Should clean path", () => {
    expect(cleanPath("//something//something")).toEqual("/something/something/")
    expect(cleanPath("something//something")).toEqual("/something/something/")
    expect(cleanPath("something/something///")).toEqual("/something/something/")
  })
})
