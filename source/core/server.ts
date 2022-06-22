import * as UWS from "uWebSockets.js"

export function createServer() {
  const servers = new Map<UWS.TemplatedApp, UWS.us_listen_socket>()

  return {
    route() {
      return this
    },

    listen(port: number) {
      return new Promise<void>((resolve) => {
        const server = UWS.App()

        server.any("/*", requestListener({}))
        server.listen(port, (socket: UWS.us_listen_socket) => {
          servers.set(server, socket)
          resolve()
        })
      })
    },
  }
}

interface RequestListenerOptions {}

function requestListener({}: RequestListenerOptions) {
  return (response: UWS.HttpResponse, request: UWS.HttpRequest) => {}
}
