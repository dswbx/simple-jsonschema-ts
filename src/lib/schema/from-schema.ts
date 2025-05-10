import type { JSONSchemaDefinition } from "../types";
import * as lib from "..";
import * as unionFns from "../union/union";
import { isObject, isTypeSchema, isArray } from "../utils";
import { InvalidRawSchemaError } from "../errors";

function eachArray<T>(array: any | any[], fn: (item: any) => T): T[] {
   return Array.isArray(array)
      ? array.map(fn)
      : array !== undefined
      ? [fn(array)]
      : [];
}

function eachObject<T>(
   object: Record<string, any>,
   fn: (item: any) => T,
   cb: (s: T, key: string) => T | Omit<T, "optional"> = (s) => s
): Record<string, T> {
   return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [key, cb(fn(value), key)])
   ) as Record<string, T>;
}

export function fromSchema<S extends JSONSchemaDefinition>(
   _schema: S
): lib.TAny & {
   optional: () => lib.TOptional<lib.TAny>;
} {
   const schema = structuredClone(_schema);

   if (typeof schema === "boolean") {
      return lib.booleanSchema(schema) as any;
   }

   if (!isObject(schema)) {
      throw new InvalidRawSchemaError(
         "non-object schemas not implemented",
         schema
      );
   }

   if ("properties" in schema && schema.properties) {
      schema.properties = eachObject(
         schema.properties,
         fromSchema,
         (s, key) => {
            if ("required" in schema && schema.required?.includes(key)) {
               return s;
            }
            return s.optional();
         }
      );
   }
   if ("patternProperties" in schema && schema.patternProperties) {
      schema.patternProperties = eachObject(
         schema.patternProperties,
         fromSchema
      );
   }

   const schemaize = [
      "additionalProperties",
      "items",
      "prefixItems",
      "propertyNames",
      "contains",
   ];
   for (const key of schemaize) {
      if (key in schema && typeof schema[key] !== "undefined") {
         if (isArray(schema[key])) {
            schema[key] = eachArray(schema[key], fromSchema);
         } else {
            schema[key] = fromSchema(schema[key]);
         }
      }
   }

   // @todo: anyOf/etc with type is ignored
   const unions = ["anyOf", "oneOf", "allOf"];
   for (const union of unions) {
      if (union in schema) {
         // @ts-ignore
         const { [union]: _schemas, ...rest } = schema;
         return unionFns[union](eachArray(_schemas, fromSchema), rest);
      }
   }

   if (isTypeSchema(schema)) {
      switch (schema.type) {
         case "string":
            return lib.string(schema);
         case "number":
            return lib.number(schema);
         case "integer":
            return lib.integer(schema);
         case "boolean":
            return lib.boolean(schema);
         case "object": {
            // @ts-ignore
            const { properties, ...rest } = schema;
            return lib.object(properties as any, rest as any);
         }
         case "array": {
            // @ts-ignore
            const { items, ...rest } = schema;
            return lib.array(items as any, rest as any);
         }
         case "null":
            return lib.nullSchema();
      }
   }

   return lib.any(schema as any);
}
