import tap from "tap"
import { assign, match } from "$/helpers/entry"

tap.test("Should assign simple values", async (t) => {
  t.same(assign({ tree: [], path: ["a", "b", "c", "d"], value: 1 }), [["a", [["b", [["c", [["d", [1]]]]]]]]])
})

tap.test("Should assign in a tree with existing key", async (t) => {
  t.same(assign({ tree: [["a", [1]]], path: ["a"], value: 2 }), [["a", [1, 2]]])
})

tap.test("Should assign in a tree with existing collection key", async (t) => {
  t.same(
    assign({
      tree: [
        [
          "a",
          [
            ["b", [1]],
            ["c", [2]],
          ],
        ],
      ],
      path: ["a", "d"],
      value: 3,
    }),
    [
      [
        "a",
        [
          ["b", [1]],
          ["c", [2]],
          ["d", [3]],
        ],
      ],
    ]
  )
})

tap.test("Should assign collection values", async (t) => {
  t.same(
    assign({
      tree: [],
      path: ["a", "b"],
      value: [
        [["d", "e"], 1],
        [["f", "g"], 2],
      ],
    }),
    [
      [
        "a",
        [
          [
            "b",
            [
              ["d", [["e", [1]]]],
              ["f", [["g", [2]]]],
            ],
          ],
        ],
      ],
    ]
  )
})

tap.test("Should throw with empty array of path", async (t) => {
  t.throws(() => assign({ tree: [], path: [], value: 5 }))
})

tap.test("Should throw with mismatch value types", async (t) => {
  t.throws(() =>
    assign({
      tree: [["a", [1]]],
      path: ["a"],
      value: [
        [["b", "c"], 2],
        [["d", "e"], 3],
      ],
    })
  )
})

tap.test("Should match values", async (t) => {
  t.same(
    match({
      tree: assign({ tree: [], path: ["a", "b", "c"], value: 0 }),
      comparator: (a, b) => a === b,
      keys: ["a", "b", "c"],
    }),
    [0]
  )
})

tap.test("Shoud match empty array for empty path", async (t) => {
  t.same(match({ tree: [], keys: [], comparator: (a, b) => a === b }), [])
})
