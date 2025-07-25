import type { Context, MiddlewareHandler, Next } from "hono";
import { McpServer, type McpServerInfo } from "./server";
import type { Tool } from "./tool";
import type { Resource } from "./resource";

export interface McpServerInit {
   tools?: Tool<any, any, any | never>[];
   resources?: Resource<any, any, any | never>[];
   context?: object;
}

export interface McpOptionsBase {
   serverInfo?: McpServerInfo;
   sessionsEnabled?: boolean;
   debug?: {
      enableHistoryEndpoint?: boolean;
   };
   endpoint?: {
      transport?: "streamableHttp";
      path: `/${string}`;
   };
}

export interface McpOptionsStatic extends McpOptionsBase, McpServerInit {
   setup?: never;
}

export interface McpOptionsSetup extends McpOptionsBase {
   setup: (c: Context) => Promise<McpServerInit>;
}

export type McpOptions = McpOptionsStatic | McpOptionsSetup;

export const mcp = (opts: McpOptions): MiddlewareHandler => {
   let server: McpServer | undefined;
   const mcpPath = opts.endpoint?.path ?? "/mcp";
   const sessions = new Map<string, McpServer>();

   return async (c: Context, next: Next) => {
      const path = c.req.path;
      let sessionId = c.req.header("Mcp-Session-Id");

      if (mcpPath !== path) {
         if (
            sessionId &&
            opts.debug?.enableHistoryEndpoint &&
            path === `${mcpPath}/__history`
         ) {
            const server = sessions.get(sessionId);
            if (server) {
               return c.json(Array.from(server.history.values()), 200);
            }
         }
         console.log("not mcp path", path, mcpPath);
         await next();
      } else {
         if (opts.sessionsEnabled) {
            if (sessionId) {
               console.log("using existing session", sessionId);
               server = sessions.get(sessionId);
            } else {
               sessionId = crypto.randomUUID();
               console.log("creating new session", sessionId);
            }
         }

         if (!server) {
            console.log("creating server");
            const ctx =
               "setup" in opts && opts.setup ? await opts.setup(c) : opts;
            server = new McpServer(opts.serverInfo, ctx?.context ?? {});

            for (const tool of ctx.tools ?? []) {
               server.registerTool(tool);
            }

            for (const resource of ctx.resources ?? []) {
               server.registerResource(resource);
            }

            if (opts.sessionsEnabled) {
               sessions.set(sessionId!, server);
            }
         }

         if (opts.sessionsEnabled) {
            c.header("Mcp-Session-Id", sessionId!);
         }
         return await server.handle(c);
      }
   };
};
