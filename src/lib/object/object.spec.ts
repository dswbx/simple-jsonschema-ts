import { expectTypeOf } from "expect-type";
import type { Static, StaticCoerced } from "../static";
import { object, partialObject, record, strictObject } from "./object";
import { type TSchema } from "../schema";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, boolean, array, anyOf, any } from "../";
import { $kind } from "../symbols";

describe("object", () => {
   test("basic", () => {
      const schema = object({});

      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ [key: string]: unknown }>();
      assertJson(object({}), { type: "object", properties: {} });
   });

   test("types", () => {
      const one = object({
         type: string({ const: "ref/resource" }),
         uri: string().optional(),
      });
      type OneStatic = (typeof one)["static"];
      //   ^?
      expectTypeOf<OneStatic>().toEqualTypeOf<{
         type: "ref/resource";
         uri?: string;
         [key: string]: unknown;
      }>();

      type OneInferred = Static<typeof one>;
      //   ^?
      expectTypeOf<OneInferred>().toEqualTypeOf<{
         type: "ref/resource";
         uri?: string;
         [key: string]: unknown;
      }>();

      {
         // with additionalProperties false
         const schema = object(
            {
               name: string(),
               age: number(),
            },
            { additionalProperties: false }
         );
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<{
            name: string;
            age: number;
         }>();
         assertJson(schema, {
            type: "object",
            properties: {
               name: { type: "string" },
               age: { type: "number" },
            },
            required: ["name", "age"],
            additionalProperties: false,
         });
      }
   });

   test("with properties", () => {
      const schema = object(
         {
            name: string(),
            age: number({ minimum: 1 }).optional(),
         },
         {
            propertyNames: string(),
         }
      );

      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name: string;
         age?: number;
         [key: string]: unknown;
      }>();
      expectTypeOf<
         Static<(typeof schema)["properties"]["name"]>
      >().toEqualTypeOf<string>();
      expectTypeOf<
         Static<(typeof schema)["propertyNames"]>
      >().toEqualTypeOf<string>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number", minimum: 1 },
         },
         propertyNames: { type: "string" },
         required: ["name"],
      });
   });

   test("strictObject", () => {
      const schema = strictObject({
         name: string(),
         age: number(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name: string;
         age: number;
      }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
         required: ["name", "age"],
         additionalProperties: false,
      });
   });

   test("partialObject", () => {
      const schema = partialObject({
         name: string(),
         age: number(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name?: string;
         age?: number;
         [key: string]: unknown;
      }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
      });

      {
         // partialObject with additionalProperties false
         const schema = partialObject(
            {
               name: string(),
               age: number(),
            },
            { additionalProperties: false }
         );
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<{
            name?: string;
            age?: number;
         }>();
         assertJson(schema, {
            type: "object",
            properties: {
               name: { type: "string" },
               age: { type: "number" },
            },
            additionalProperties: false,
         });
      }
   });

   test("objects of objects", () => {
      const schema = object({
         name: string(),
         age: number(),
         address: object({
            street: string(),
            city: string(),
         }),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         [key: string]: unknown;
         name: string;
         age: number;
         address: { [key: string]: unknown; street: string; city: string };
      }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
            address: {
               type: "object",
               properties: {
                  street: { type: "string" },
                  city: { type: "string" },
               },
               required: ["street", "city"],
            },
         },
         required: ["name", "age", "address"],
      });
   });

   test("with optional", () => {
      const schema = object({
         name: string(),
         age: number().optional(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name: string;
         age?: number;
         [key: string]: unknown;
      }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
         required: ["name"],
      });
   });

   test("record", () => {
      {
         // simple
         const simple = record(string());
         type Simple = Static<typeof simple>;
         expectTypeOf<Simple>().toEqualTypeOf<{ [key: string]: string }>();
         assertJson(simple, {
            type: "object",
            additionalProperties: { type: "string" },
         });
      }

      const schema = record(
         object({
            name: string(),
            age: number().optional(),
         })
      );
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         [key: string]: { name: string; age?: number; [key: string]: unknown };
      }>();

      assertJson(schema, {
         type: "object",
         additionalProperties: {
            type: "object",
            properties: { name: { type: "string" }, age: { type: "number" } },
            required: ["name"],
         },
      });

      {
         // in union
         const schema = anyOf([
            record(
               object({
                  name: string(),
                  age: number().optional(),
               })
            ),
            string(),
         ]);
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<
            | {
                 [key: string]: {
                    name: string;
                    age?: number;
                    [key: string]: unknown;
                 };
              }
            | string
         >();
      }

      {
         // any
         const inner = any();
         type Inner = (typeof inner)["static"];
         //   ^?
         expectTypeOf<Inner>().toEqualTypeOf<any>();
         type InnerStatic = Static<typeof inner>;
         //   ^?
         expectTypeOf<InnerStatic>().toEqualTypeOf<any>();

         const schema = record(inner);
         type Inferred = Static<typeof schema>;
         //   ^?

         expectTypeOf<Inferred>().toEqualTypeOf<{
            [key: string]: any;
         }>();
      }
   });

   test("partialObject", () => {
      const schema = partialObject({
         name: string(),
         // expect this to be non-influential
         age: number().optional(),
      });

      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name?: string;
         age?: number;
         [key: string]: unknown;
      }>();
      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
      });
   });

   test("merging", () => {
      const schema1 = object({ string: string() });
      const schema2 = object({ number: number().optional() });

      // expect properties to be accessible
      expect(schema1.properties.string[$kind]).toEqual("string");

      const merged = object({
         ...schema1.properties,
         ...schema2.properties,
      });

      expect(Object.keys(merged.properties)).toEqual(["string", "number"]);
      assertJson(merged, {
         type: "object",
         properties: {
            string: { type: "string" },
            number: { type: "number" },
         },
         required: ["string"],
      });
   });

   describe("validate", () => {
      test("base", () => {
         const schema = object({});
         expect(schema.validate({}).valid).toBe(true);
         expect(schema.validate(1).errors[0]?.error).toEqual("Expected object");
      });

      test("properties", () => {
         const schema = object({
            name: string(),
            age: number(),
         });
         expect(schema.validate({ name: "John", age: 30 }).valid).toBe(true);
         expect(schema.validate({ name: "John" }).errors[0]?.error).toEqual(
            "Expected object with required properties name, age"
         );
         expect(
            schema.validate({ name: "John", age: "30" }).errors[0]?.error
         ).toEqual("Expected number");
         expect(schema.validate({}).errors[0]?.error).toEqual(
            "Expected object with required properties name, age"
         );

         {
            // patternProperties ignores additionalProperties
            const result = strictObject(
               { a: number() },
               {
                  patternProperties: { "^b": string() },
               }
            ).validate({ a: 11, b: "2" });
            expect(result.valid).toBe(true);
         }

         {
            // an additional invalid property is invalid
            const result = object(
               {
                  foo: any(),
                  bar: any(),
               },
               {
                  additionalProperties: boolean(),
               }
            ).validate({
               foo: 1,
               bar: 2,
               quux: 12,
            });
            expect(result.valid).toBe(false);
            expect(result.errors[0]?.error).toEqual("Expected boolean");
         }
      });

      test("template", () => {
         const schema = object({
            name: string(),
            surname: string().optional(),
         });
         expect(schema.template()).toEqual({ name: "" });
         expect(schema.template({ withOptional: true })).toEqual({
            name: "",
            surname: "",
         });

         // object in object
         {
            const schema = object({
               nested: object({
                  name: string().optional(),
               }).optional(),
            });
            expect(schema.template({ withOptional: true })).toEqual({
               nested: {
                  name: "",
               },
            });
         }
      });
   });

   test("typing", () => {
      const schema = object({
         url: string({
            pattern: "^https?://",
            coerce: () => "what" as const,
         }),
         force: boolean({ coerce: () => true as const }).optional(),
      });
      type Helper<S extends TSchema> = Static<S>;
      type Out = Helper<typeof schema>;
      //   ^?
   });

   test("coerce", () => {
      const schema = object({
         name: string(),
         age: number(),
      });
      expect(schema.coerce("{}")).toEqual({});
      expect(schema.coerce('{"name": "John", "age": "30"}')).toEqual({
         name: "John",
         age: 30,
      });
      expect(schema.coerce({ name: "John", age: "30" })).toEqual({
         name: "John",
         age: 30,
      });

      {
         const s = string({ coerce: () => "asdf" as const });
         const schema = object({
            name: s,
         });
         type StringCoerced = StaticCoerced<typeof s>;
         expectTypeOf<StringCoerced>().toEqualTypeOf<"asdf">();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<{ name: "asdf" }>();
      }

      {
         const a = array(
            string({
               pattern: "/^https?:///",
               coerce: () => "asdf" as const,
            })
         );
         type Coerced = StaticCoerced<typeof a>;
         expectTypeOf<Coerced>().toEqualTypeOf<"asdf"[]>();
      }

      {
         const s = object({
            url: string({
               pattern: "/^https?:///",
               coerce: (value) => "asdf" as const,
            }),
            force: boolean().optional(),
         });
         type Inferred = Static<typeof s>;
         expectTypeOf<Inferred>().toEqualTypeOf<{
            url: string;
            force?: boolean;
            [key: string]: unknown;
         }>();
         type Coerced = StaticCoerced<typeof s>;
         expectTypeOf<Coerced>().toEqualTypeOf<{
            url: "asdf";
            force?: boolean;
         }>();
      }
   });
});
