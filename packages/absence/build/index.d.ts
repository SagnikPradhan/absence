interface Server<Context extends BaseContext> {
    route(path: string): Route<Context>;
    route(options: {
        path: string;
        method: string;
    }): Route<Context>;
    use<Name extends string, ContextProperty extends {}>(plugin: Plugin<Name, Context, ContextProperty>): Server<{
        [name in Name]: ContextProperty;
    } & Context>;
    useErrorHandler(handler: (error: Error) => Promise<void>): Server<Context>;
    listen(port: number): Promise<number>;
    stop(): void;
}
interface Route<Context extends BaseContext> {
    use<Name extends string, ContextProperty extends {}>(plugin: Plugin<Name, Context, ContextProperty>): Route<{
        [name in Name]: ContextProperty;
    } & Context>;
    handle(handler: Handler<Context>): void;
}
interface RouteDetails<C extends BaseContext> {
    path: string;
    method: string;
    handler: Handler<C>;
    plugins: Plugin[];
}
type Handler<Context extends BaseContext> = (context: Context) => Promise<void>;
interface Plugin<Name extends string, Context extends BaseContext, ContextProperty extends {}> {
    name: Name;
    initialize?(): Promise<ContextProperty> | Promise<void>;
    handler?(context: Context & {
        [name in Name]: ContextProperty;
    }): Promise<void>;
}
interface BaseContext {
    request: Request;
    response: Response;
}
interface Request {
    path: string;
    method: string;
    queries: Record<string, string>;
    headers: Record<string, string>;
    parameters: Record<string, string>;
    body: string;
}
interface Response {
    setHeader(key: string, value: string): Response;
    setStatus(status: number, message?: string): Response;
    send(body?: string): void;
}
declare function createServer<C extends BaseContext>(): Server<C>;
export { Server, Route, RouteDetails, Handler, Plugin, BaseContext, Request, Response, createServer };
