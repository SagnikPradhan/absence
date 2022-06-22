export interface Request {
  headers: Record<string, string>
  body: unknown
}

export interface Response {
  setHeader(key: string, value: string): void
  setBody(value: unknown): void
  setStatus(code: number, message?: string): void
}

export interface BaseContext extends Request, Response {}
