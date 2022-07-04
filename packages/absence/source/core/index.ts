export interface Server<Context extends BaseContext = BaseContext> {
  route(path: string): Route<Context>
  route(options: { path: string; method: string }): Route<Context>

  use<Name extends string, ContextProperty extends {}>(
    plugin: Plugin<Name, Context, ContextProperty>
  ): Server<{ [name in Name]: ContextProperty } & Context>

  useErrorHandler(handler: (error: Error) => Promise<void>): Server<Context>

  listen(port: number): Promise<number>
  stop(): void
}

export interface Route<Context extends BaseContext> {
  use<Name extends string, ContextProperty extends {}>(
    plugin: Plugin<Name, Context, ContextProperty>
  ): Route<{ [name in Name]: ContextProperty } & Context>

  handle(handler: Handler<Context>): void
}

export interface RouteDetails<C extends BaseContext> {
  path: string
  method: string
  handler: Handler<C>
  plugins: Plugin[]
}

export type Handler<Context extends BaseContext = BaseContext> = (
  context: Context
) => Promise<void>

export interface Plugin<
  Name extends string = string,
  Context extends BaseContext = BaseContext,
  ContextProperty extends {} = {}
> {
  name: Name

  initialize?(): Promise<ContextProperty> | Promise<void>

  handler?(
    context: Context & { [name in Name]: ContextProperty }
  ): Promise<void>
}

export interface BaseContext {
  request: Request
  response: Response
}

export interface Request {
  path: string
  method: string
  queries: Record<string, string>
  headers: Record<string, string>
  parameters: Record<string, string>
  body: string
}

export interface Response {
  setHeader(key: string, value: string): Response
  setStatus(status: number, message?: string): Response
  send(body?: string): void
}

export { createServer } from "./server"
