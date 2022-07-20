import type { Request } from "./request"
import type { Response } from "./response"

export interface BaseContext {
  request: Request
  response: Response
}

export type Handler<C extends BaseContext, P extends Properties | void> = (
  context: C
) => Promise<P> | P

export interface Properties<C = {}, Request = {}, Response = {}> {
  context?: C
  request?: Request
  response?: Response
}

export interface Middleware<C extends BaseContext, P extends Properties> {
  name: string | null
  handler: Handler<C, P> | Handler<C, void>
}

export type ResolvedContext<
  C extends BaseContext,
  P extends Properties,
  N extends Exclude<string, keyof C> = never
> = P extends Properties<infer Context, infer Request, infer Response>
  ? C &
      Prefix<N, Context> & {
        request: Request & Prefix<N, C["request"]>
        response: Response & Prefix<N, C["response"]>
      }
  : never

type Prefix<N extends string, O> = N extends never ? O : { [K in N]: O }
