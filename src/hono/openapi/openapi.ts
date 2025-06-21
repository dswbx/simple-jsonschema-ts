import type { Env, Hono } from "hono";
import type { MiddlewareHandler } from "hono/types";
import { $symbol } from "../shared";
import {
   merge,
   schemaToSpec,
   toOpenAPIPath,
   generateOperationId,
} from "./utils";
import * as t from "./types";

interface CustomEnv extends Env {
   [key: string]: any;
}

export const openAPISpecs = <E extends Env>(
   hono: Hono<E>,
   specs: Partial<t.Document> = {} as t.Document
) => {
   let initialized = false;

   return async (c) => {
      if (!initialized) {
         initialized = true;
         specs.paths = specs.paths ?? {};

         for (const route of hono.routes) {
            if ($symbol in route.handler) {
               const method = route.method.toLowerCase();
               const path = toOpenAPIPath(route.path);
               const { type, value } = route.handler[$symbol] as any;
               if (!specs.paths[path]) {
                  specs.paths[path] = {};
               }
               if (!specs.paths[path][method]) {
                  specs.paths[path][method] = {
                     responses: {},
                     operationId: generateOperationId(method, path),
                  };
               }
               const obj = specs.paths[path][method];

               switch (type) {
                  case "parameters":
                     const { parameters, requestBody } = schemaToSpec(
                        value.schema,
                        value.target
                     );

                     if (parameters) {
                        if (!obj.parameters) {
                           obj.parameters = [];
                        }
                        obj.parameters.push(
                           ...parameters.filter((p) => {
                              try {
                                 return !obj.parameters.some(
                                    // @ts-ignore
                                    (p2) => p2.name === p.name && p2.in === p.in
                                 );
                              } catch (e) {
                                 return true;
                              }
                           })
                        );
                     }

                     if (requestBody) {
                        if (!obj.requestBody) {
                           obj.requestBody = {};
                        }
                        merge(obj.requestBody, requestBody);
                     }

                     break;
                  case "route-doc":
                     merge(specs.paths[path][method], value);
                     break;
               }
            }
         }
      }

      return c.json({
         openapi: "3.1.0",
         info: {
            title: "API",
            ...specs.info,
         },
         ...specs,
      });
   };
};

export const describeRoute = <E extends Env, P extends string>(
   specs: t.DescribeRouteOptions
) => {
   const handler: MiddlewareHandler<E, P> = async (c, next) => {
      await next();
   };

   return Object.assign(handler, {
      [$symbol]: {
         type: "route-doc",
         value: specs,
      },
   });
};
