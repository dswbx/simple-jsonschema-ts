import { describe, expect, test } from "bun:test";
import { fromSchema } from "./from-schema";
import { SchemaType } from "../schema";

const expectType = (
   schema: SchemaType,
   type: string,
   additional: Record<string, any> = {}
) => {
   expect(schema._schema.type).toEqual(type);

   const keys = Object.keys(additional);
   for (const key of keys) {
      expect(
         schema._schema[key],
         `expected ${key} to be ${additional[key]}`
      ).toEqual(additional[key]);
   }
};

describe("fromSchema", () => {
   test("base", () => {
      expectType(fromSchema({ type: "string" }), "string");
      expectType(
         fromSchema({
            type: "string",
            maxLength: 10,
            minLength: 1,
            pattern: "/a/",
         }),
         "string",
         {
            maxLength: 10,
            minLength: 1,
            pattern: "/a/",
         }
      );
      expectType(fromSchema({ type: "number" }), "number");
      expectType(
         fromSchema({
            type: "number",
            exclusiveMaximum: 1,
            multipleOf: 1,
            minimum: 1,
            exclusiveMinimum: 1,
            maximum: 2,
         }),
         "number",
         {
            exclusiveMaximum: 1,
            multipleOf: 1,
            minimum: 1,
            maximum: 2,
            exclusiveMinimum: 1,
         }
      );
      expectType(fromSchema({ type: "integer" }), "integer");
      expectType(fromSchema({ type: "boolean" }), "boolean");
   });

   test("any", () => {
      expect(fromSchema({ minimum: 2 })._schema.minimum).toEqual(2);
   });

   test("objects", () => {
      expectType(
         fromSchema({
            type: "object",
            properties: { name: { type: "string" } },
         }),
         "object"
      );
   });

   test("arrays", () => {
      const schema = fromSchema({
         type: "array",
         items: { type: "string" },
      });

      expectType(schema, "array");
      // @ts-ignore
      expectType(schema.items, "string");

      expectType(
         fromSchema({
            type: "array",
            contains: { type: "string" },
         })._schema.contains!,
         "string"
      );
   });

   test("boolean schema", () => {
      {
         const s = fromSchema(true);
         expect(s.validate(true).valid).toBe(true);
         expect(s.validate(false).valid).toBe(true);
      }
      {
         const s = fromSchema(false);
         expect(s.validate(true).valid).toBe(false);
         expect(s.validate(false).valid).toBe(false);
      }
   });

   test("object with required/optional", () => {
      const s = fromSchema({
         type: "object",
         properties: { name: { type: "string" }, age: { type: "number" } },
         required: ["name"],
      }) as any;
      expect(s.properties?.name?.type).toEqual("string");
      expect(s.properties?.name?._optional).toBe(false);
      expect(s.properties?.age?.type).toEqual("number");
      expect(s.properties?.age?._optional).toEqual(true);
      expect(s._schema.required).toEqual(["name"]);
   });

   test("examples", () => {
      {
         const s = fromSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            properties: { foo: {}, bar: {} },
            patternProperties: { "^v": {} },
            additionalProperties: false,
         });
         expect(s._schema.properties?.foo).toBeInstanceOf(SchemaType);
         expect(s._schema.properties?.bar).toBeInstanceOf(SchemaType);
         expect(s._schema.patternProperties?.["^v"]).toBeInstanceOf(SchemaType);
         expect(s._schema.additionalProperties).toBeInstanceOf(SchemaType);
      }

      {
         const s = fromSchema({
            properties: {
               bar: true,
               baz: true,
            },
            required: ["bar"],
         });
         expect(s._schema.properties?.bar).toBeInstanceOf(SchemaType);
         expect(s._schema.properties?.baz).toBeInstanceOf(SchemaType);
         expect(s._schema.properties?.baz?._optional).toEqual(true);
         expect(s._schema.required).toEqual(["bar"]);
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
         expect(s._schema.oneOf?.[0]?._schema.properties?.bar).toBeInstanceOf(
            SchemaType
         );
         // @ts-ignore
         expect(s._schema.oneOf?.[0]?._schema.properties?.baz).toBeInstanceOf(
            SchemaType
         );
         // @ts-ignore
         expect(
            s._schema.oneOf?.[0]?._schema.properties?.baz?._optional
         ).toEqual(true);
         // @ts-ignore
         expect(s._schema.oneOf?.[0]?._schema.required).toEqual(["bar"]);
         // @ts-ignore
         expect(s._schema.oneOf?.[1]?._schema.properties?.foo).toBeInstanceOf(
            SchemaType
         );
         // @ts-ignore
         expect(s._schema.oneOf?.[1]?._schema.required).toEqual(["foo"]);
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
         }) as any;
         expect(s._schema.properties?.alpha?._schema.type).toEqual("number");
         expect(s._schema.properties?.alpha?._optional).toEqual(true);
         expect(s._schema.properties?.alpha?._schema.default).toEqual(5);
         // @ts-ignore
         expect(s._schema.properties?.alpha?._schema.maximum).toEqual(3);
      }

      {
         const s = fromSchema({
            not: { type: "integer" },
         });
         expect(s.validate("foo").valid).toBe(true);
         expect(s.validate(123).valid).toBe(false);
      }

      {
         const s = fromSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            allOf: [{ multipleOf: 2 }],
            anyOf: [{ multipleOf: 3 }],
            oneOf: [{ multipleOf: 5 }],
         }) as any;
         expect(s._schema.allOf?.[0]?._schema.multipleOf).toEqual(2);
         expect(s._schema.anyOf?.[0]?._schema.multipleOf).toEqual(3);
         expect(s._schema.oneOf?.[0]?._schema.multipleOf).toEqual(5);
      }
   });
});
