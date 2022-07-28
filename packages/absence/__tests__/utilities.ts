import {
  addReadonlyProperty,
  createObjectWithReadonlyProperties,
} from "../source/utilities"

test("Should add readonly property", () => {
  expect(addReadonlyProperty({ a: 1 }, "b", 2)).toEqual({ a: 1, b: 2 })
})

test("Should create same object with readonly properties", () => {
  expect(createObjectWithReadonlyProperties({ a: 1, b: 2 })).toEqual({
    a: 1,
    b: 2,
  })
})
