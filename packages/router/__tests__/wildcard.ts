import { findWildcard, extractParameter, Kind } from ".."

describe("Wildcards", () => {
  it("should find wildcards", () => {
    expect(findWildcard("/a/:b/c/d")).toEqual({
      kind: Kind.Parameter,
      prefix: "/a/",
      wildcard: ":b/",
      suffix: "c/d",
    })
  })

  it("should find wildcards with no prefix or suffix", () => {
    expect(findWildcard(":parameter")).toEqual({
      kind: Kind.Parameter,
      prefix: "",
      wildcard: ":parameter",
      suffix: "",
    })
  })

  it("should extract parameters", () => {
    expect(extractParameter("a/b/c/", Kind.Parameter)).toEqual("a")
    expect(extractParameter("a/b/c/", Kind.CatchAll)).toEqual("a/b/c")
  })
})
