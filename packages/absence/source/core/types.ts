export const HTTPMethods = <const>[
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
]

export type HTTPMethod = typeof HTTPMethods[number]
