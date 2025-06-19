import type { ObjectSchema } from "jsonv-ts";
import * as t from "./types";

export function isPlainObject(
   value: unknown
): value is Record<string, unknown> {
   return Object.prototype.toString.call(value) === "[object Object]";
}

export function isObject(value: unknown): value is Record<string, unknown> {
   return value !== null && typeof value === "object";
}

export function merge(obj: any, ...sources: any[]) {
   for (const source of sources) {
      for (const [key, value] of Object.entries(source)) {
         if (value === undefined) {
            continue;
         }

         // These checks are a week attempt at mimicking the various edge-case behaviors
         // that Lodash's `_.merge()` exhibits. Feel free to simplify and
         // remove checks that you don't need.
         if (!isPlainObject(value) && !Array.isArray(value)) {
            obj[key] = value;
         } else if (Array.isArray(value) && !Array.isArray(obj[key])) {
            obj[key] = value;
         } else if (!isObject(obj[key])) {
            obj[key] = value;
         } else {
            merge(obj[key], value);
         }
      }
   }

   return obj;
}

const honoTargetToParameterin = {
   query: "query",
   param: "path",
   header: "header",
   cookie: "cookie",
} as const;

const honoTargetToRequestBody = {
   json: {
      type: "application/json",
   },
   form: {
      type: "multipart/form-data",
   },
} as const;

export function schemaToSpec(
   obj: ObjectSchema,
   target: string
): Omit<t.OperationObject, "responses"> {
   const _in = honoTargetToParameterin[target];
   const _requestBody = honoTargetToRequestBody[target];

   if (_in) {
      return {
         parameters: Object.entries(obj.properties).map(([key, subSchema]) => {
            return {
               name: key,
               in: _in,
               required: obj.required?.includes(key) || undefined,
               // @ts-expect-error
               description: subSchema?.description || undefined,
               schema: structuredClone(subSchema.toJSON()),
            };
         }),
      };
   } else if (_requestBody) {
      return {
         requestBody: {
            content: {
               [_requestBody.type]: {
                  schema: structuredClone(obj.toJSON()),
                  example:
                     // @ts-expect-error
                     obj.examples?.[0] ?? obj.template({ withOptional: true }),
               },
            },
         },
      };
   }

   return {};
}

export const toOpenAPIPath = (path: string) =>
   path
      .split("/")
      .map((x) => {
         let tmp = x;
         if (tmp.startsWith(":")) {
            const match = tmp.match(/^:([^{?]+)(?:{(.+)})?(\?)?$/);
            if (match) {
               const paramName = match[1];
               tmp = `{${paramName}}`;
            } else {
               tmp = tmp.slice(1, tmp.length);
               if (tmp.endsWith("?")) tmp = tmp.slice(0, -1);
               tmp = `{${tmp}}`;
            }
         }

         return tmp;
      })
      .join("/");

export const capitalize = (word: string) =>
   word.charAt(0).toUpperCase() + word.slice(1);

const generateOperationIdCache = new Map<string, string>();

export const generateOperationId = (method: string, paths: string) => {
   const key = `${method}:${paths}`;

   if (generateOperationIdCache.has(key)) {
      return generateOperationIdCache.get(key) as string;
   }

   let operationId = method;

   if (paths === "/") return `${operationId}Index`;

   for (const path of paths.split("/")) {
      if (path.charCodeAt(0) === 123) {
         operationId += `By${capitalize(path.slice(1, -1))}`;
      } else {
         operationId += capitalize(path);
      }
   }

   generateOperationIdCache.set(key, operationId);

   return operationId;
};
