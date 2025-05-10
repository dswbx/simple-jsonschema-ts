import { describe, expect, test } from "bun:test";
import { fromSchema } from "./from-schema";
import type { TSchema } from "../base";
import { $kind, $optional } from "../symbols";

const expectType = (
   schema: TSchema,
   type: string,
   additional: Record<string, any> = {}
) => {
   expect(schema[$kind]).toEqual(type);

   const keys = Object.keys(additional);
   for (const key of keys) {
      expect(schema[key]).toEqual(additional[key]);
   }
};

describe("fromSchema", () => {
   test("base", () => {
      expectType(fromSchema({ type: "string" } as const), "string");
      expectType(
         fromSchema({
            type: "string",
            maxLength: 10,
            minLength: 1,
            pattern: "/a/",
         } as const),
         "string",
         {
            maxLength: 10,
            minLength: 1,
            pattern: "/a/",
         }
      );
      expectType(fromSchema({ type: "number" } as const), "number");
      expectType(
         fromSchema({
            type: "number",
            exclusiveMaximum: 1,
            multipleOf: 1,
            minimum: 1,
            exclusiveMinimum: 1,
            maximum: 2,
         } as const),
         "number",
         {
            exclusiveMaximum: 1,
            multipleOf: 1,
            minimum: 1,
            maximum: 2,
            exclusiveMinimum: 1,
         }
      );
      expectType(fromSchema({ type: "integer" } as const), "integer");
      expectType(fromSchema({ type: "boolean" } as const), "boolean");
   });

   test("objects", () => {
      expectType(
         fromSchema({
            type: "object",
            properties: { name: { type: "string" } },
         } as const),
         "object"
      );
   });

   test("arrays", () => {
      const schema = fromSchema({
         type: "array",
         items: { type: "string" },
      } as const);

      schema.contains;

      expectType(schema, "array");
      // @ts-ignore
      expectType(schema.items, "string");

      expectType(
         fromSchema({
            type: "array",
            contains: { type: "string" },
         }).contains!,
         "string"
      );
   });

   test("boolean schema", () => {
      {
         const s = fromSchema(true);
         expect(s[$kind]).toEqual("booleanSchema");
         expect(s.validate(true).valid).toBe(true);
         expect(s.validate(false).valid).toBe(true);
      }
      {
         const s = fromSchema(false);
         expect(s[$kind]).toEqual("booleanSchema");
         expect(s.validate(true).valid).toBe(false);
         expect(s.validate(false).valid).toBe(false);
      }
   });

   test("object with required/optional", () => {
      const s = fromSchema({
         type: "object",
         properties: { name: { type: "string" }, age: { type: "number" } },
         required: ["name"],
      });
      expect(s.properties?.name?.[$kind]).toEqual("string");
      expect(s.properties?.name?.[$optional]).toBeUndefined();
      expect(s.properties?.age?.[$kind]).toEqual("number");
      expect(s.properties?.age?.[$optional]).toEqual(true);
      expect(s.required).toEqual(["name"]);
   });

   test("examples", () => {
      {
         const s = fromSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            properties: { foo: {}, bar: {} },
            patternProperties: { "^v": {} },
            additionalProperties: false,
         });
         expect(s.properties?.foo?.[$kind]).toEqual("any");
         expect(s.properties?.bar?.[$kind]).toEqual("any");
         expect(s.patternProperties?.["^v"]?.[$kind]).toEqual("any");
         expect(s.additionalProperties?.[$kind]).toEqual("booleanSchema");
      }

      {
         const s = fromSchema({
            properties: {
               bar: true,
               baz: true,
            },
            required: ["bar"],
         });
         expect(s.properties?.bar?.[$kind]).toEqual("booleanSchema");
         expect(s.properties?.baz?.[$kind]).toEqual("booleanSchema");
         expect(s.properties?.baz?.[$optional]).toEqual(true);
         expect(s.required).toEqual(["bar"]);
      }

      {
         const s = fromSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            oneOf: [
               {
                  properties: {
                     bar: true,
                     baz: true,
                  },
                  required: ["bar"],
               },
               {
                  properties: {
                     foo: true,
                  },
                  required: ["foo"],
               },
            ],
         });
         // @ts-ignore
         expect(s.oneOf?.[0]?.properties?.bar?.[$kind]).toEqual(
            "booleanSchema"
         );
         // @ts-ignore
         expect(s.oneOf?.[0]?.properties?.baz?.[$kind]).toEqual(
            "booleanSchema"
         );
         // @ts-ignore
         expect(s.oneOf?.[0]?.properties?.baz?.[$optional]).toEqual(true);
         // @ts-ignore
         expect(s.oneOf?.[0]?.required).toEqual(["bar"]);
         // @ts-ignore
         expect(s.oneOf?.[1]?.properties?.foo?.[$kind]).toEqual(
            "booleanSchema"
         );
         // @ts-ignore
         expect(s.oneOf?.[1]?.required).toEqual(["foo"]);
      }

      {
         const s = fromSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            type: "object",
            properties: {
               alpha: {
                  type: "number",
                  maximum: 3,
                  default: 5,
               },
            },
         });
         expect(s.properties?.alpha?.[$kind]).toEqual("number");
         expect(s.properties?.alpha?.[$optional]).toEqual(true);
         expect(s.properties?.alpha?.default).toEqual(5);
         // @ts-ignore
         expect(s.properties?.alpha?.maximum).toEqual(3);
      }
   });
});
