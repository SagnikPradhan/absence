import type { Request } from "./request"
import type { Response } from "./response"

export interface BaseContext<
  Parameters extends Record<string, string> = Record<string, string>
> {
  request: Request<Parameters>
  response: Response
}

export type Handler<C extends BaseContext, P extends Properties | void> = (
  context: C
) => Promise<P> | P

/** Properties to be injected */
export interface Properties<C = {}, Request = {}, Response = {}> {
  /** Properties to be injected in context */
  context?: C
  /** Properties to be injected in request */
  request?: Request
  /** Properties to be injected in response */
  response?: Response
}

export interface Middleware<
  C extends BaseContext = BaseContext,
  P extends Properties = Properties
> {
  name: string | null
  handler: Handler<C, P> | Handler<C, void>
}

export type ResolvedContext<
  C extends BaseContext,
  P extends Properties,
  N = void
> = P extends Properties<infer Context, infer Request, infer Response>
  ? C &
      Prefix<N, Context> & {
        request: Request & Prefix<N, C["request"]>
        response: Response & Prefix<N, C["response"]>
      }
  : never

type Prefix<O, N> = N extends string ? { [K in N]: O } : O

export type HTTPMethods =
  | "get"
  | "head"
  | "post"
  | "put"
  | "delete"
  | "connect"
  | "options"
  | "trace"
  | "patch"

type ParameterTokens = ":" | "*"

export type GetParameters<S extends string> =
  S extends `${string}${ParameterTokens}${infer Parameter}/${infer Rest}`
    ? { [K in Parameter | keyof GetParameters<Rest>]: string }
    : S extends `${string}${ParameterTokens}${infer Parameter}`
    ? { [K in Parameter]: string }
    : {}
