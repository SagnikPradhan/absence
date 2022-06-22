export interface Route {
  path: string
  method: string
  handler(): Promise<void> | void
}
