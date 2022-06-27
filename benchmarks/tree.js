const Benchmark = require("benchmark")
const AbsenceTree = require("../build").Tree
const KoaTree = require("koa-tree-router/tree")

const absence = new AbsenceTree()
const koa = new KoaTree()

const routes = [
  "/user",
  "/user/comments",
  "/user/avatar",
  "/user/lookup/username/:username",
  "/user/lookup/email/:address",
  "/event/:id",
  "/event/:id/comments",
  "/event/:id/comment",
  "/map/:location/events",
  "/status",
  "/very/deeply/nested/route/hello/there",
  "/static/*something",
]

for (let index = 0; index < routes.length; index++) {
  const route = routes[index]
  absence.add(route, index)
  koa.addRoute(route, index)
}

const suite = new Benchmark.Suite()

suite
  .add("Absence", () => {
    absence.lookup("/user/")
    absence.lookup("/user/comments/")
    absence.lookup("/user/lookup/username/john/")
    absence.lookup("/event/abcd1234/comments/")
    absence.lookup("/very/deeply/nested/route/hello/there/")
    absence.lookup("/static/index.html/")
  })
  .add("Koa-Tree", () => {
    koa.search("/user")
    koa.search("/user/comments")
    koa.search("/user/lookup/username/john")
    koa.search("/event/abcd1234/comments")
    koa.search("/very/deeply/nested/route/hello/there")
    koa.search("/static/index.html")
  })
  .on("cycle", (ev) => console.log(ev.target.toString()))
  .run({ async: true })
