import tap from "tap"
import { Tree } from "$/helpers/tree"

tap.test("Should set and retrieve values", (t) => {
  const tree = new Tree<string>()

  tree.add("/", "A")
  tree.add("/a/:parameter", "B")
  tree.add("/a/c/:parameter", "F")
  tree.add("/a/b", "C")
  tree.add("/a/b/:parameter", "D")
  tree.add("/a/b/c/*parameter", "E")
  tree.add("/a", "G")

  t.same(tree.lookup("/"), { data: "A", parameters: {} })
  t.same(tree.lookup("/a/1/"), { data: "B", parameters: { parameter: "1" } })
  t.same(tree.lookup("/a/b/"), { data: "C", parameters: {} })
  t.same(tree.lookup("/a/b/2/"), { data: "D", parameters: { parameter: "2" } })
  t.same(tree.lookup("/a/b/c/3"), {
    data: "E",
    parameters: { parameter: "3" },
  })
  t.same(tree.lookup("/a/c/alphabets/"), {
    data: "F",
    parameters: { parameter: "alphabets" },
  })
  t.same(tree.lookup("/d/something/somethingelse/"), null)
  t.same(tree.lookup("/a/"), { data: "G", parameters: {} })

  t.end()
})

tap.test(
  "Should throw for different named parameters at same position",
  (t) => {
    const tree = new Tree<string>()

    t.throws(() => {
      tree.add("/path/:users", "A")
      tree.add("/path/:somethingElse", "B")
    }, /Found duplicate parameters at same position - :somethingElse, :users/)

    t.end()
  }
)

tap.test("Should throw for duplicate routes", (t) => {
  const tree = new Tree<string>()

  t.throws(() => {
    tree.add("/path/something", "A")
    tree.add("/path/something", "B")
  }, /Found duplicate routes/)

  t.end()
})

tap.test("Should use fallback values properly", (t) => {
  const tree = new Tree<string>()

  tree.add("/user/admin", "A")
  tree.add("/user/admin/dashboard", "B")
  tree.add("/user/admin/dashboard/page", "C")
  tree.add("/user/:user/dashboard/page", "D")
  tree.add("/user/:user/dashboard/page/something", "E")
  tree.add("/posts/feed", "F")
  tree.add("/posts/:id", "G")

  t.same(tree.lookup("/user/admin/dashboard/page/"), {
    data: "C",
    parameters: {},
  })
  t.same(tree.lookup("/user/random/dashboard/page/something/"), {
    data: "E",
    parameters: { user: "random" },
  })
  t.same(tree.lookup("/posts/107/"), { data: "G", parameters: { id: "107" } })
  t.same(tree.lookup("/posts/107/doesnotexist/"), null)

  t.end()
})
