export function createObjectWithReadonlyProperties<
  O extends Record<string, unknown>
>(object: O): O {
  if (process.env["NODE_ENV"] === "production") return object

  const readonlyVariant = {}

  for (const key in object)
    if (Object.hasOwn(object, key))
      addReadonlyProperty(readonlyVariant, key, object[key])

  return readonlyVariant as O
}

export function addReadonlyProperty<O extends {}, Key extends string, V>(
  object: O,
  key: Key,
  value: V
) {
  // @ts-expect-error Cannot index
  if (process.env["NODE_ENV"] === "production") object[key] = value
  else
    Object.defineProperty(object, key, {
      configurable: false,
      writable: false,
      enumerable: true,
      value: isObject(value)
        ? createObjectWithReadonlyProperties(value)
        : value,
    })

  return object as O & { [K in Key]: V }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
