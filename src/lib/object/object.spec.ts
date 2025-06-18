import { expectTypeOf } from "expect-type";
import type { Static, StaticCoerced } from "../static";
import { object } from "./object";
import { SchemaType } from "../schema";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string } from "../string/string";
import { number } from "../number/number";
import { boolean } from "../boolean/boolean";
import { array } from "../array/array";
import { any } from "../schema/misc";

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

      type OneCoerced = StaticCoerced<typeof one>;
      expectTypeOf<OneCoerced>().toEqualTypeOf<{
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
         Static<(typeof schema)["_schema"]["propertyNames"]>
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
      const schema = object({
         name: string(),
         age: number(),
      }).strict();
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
      const schema = object({
         name: string(),
         age: number(),
      }).partial();
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
         const schema = object(
            {
               name: string(),
               age: number(),
            },
            { additionalProperties: false }
         ).partial();
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

         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<{
            name?: string;
            age?: number;
         }>();
      }

      {
         // partial with coerce
         const schema = object({
            name: string({ coerce: (v) => v as string | undefined }),
            age: number(),
         }).partial();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<{
            name?: string;
            age?: number;
            [key: string]: unknown;
         }>();
      }

      {
         // partial object with strict
         const schema = object({
            name: string(),
            age: number(),
         })
            .partial()
            .strict();
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

      {
         // partial object with optional props
         const schema = object({
            name: string(),
            // expect this to be non-influential
            age: number().optional(),
         }).partial();

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

   test("merging", () => {
      const schema1 = object({ string: string() });
      const schema2 = object({ number: number().optional() });

      // expect properties to be accessible
      expect(schema1.properties.string.type).toEqual("string");

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
            const result = object(
               { a: number() },
               {
                  patternProperties: { "^b": string() },
               }
            )
               .strict()
               .validate({ a: 11, b: "2" });
            expect(result.valid).toBe(true);
         }

         {
            // an additional invalid property is invalid
            const schema = object(
               {
                  foo: any(),
                  bar: any(),
               },
               {
                  additionalProperties: boolean(),
               }
            );
            const result = schema.validate({
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
      type Helper<S extends SchemaType> = Static<S>;
      type Out = Helper<typeof schema>;
      //   ^?
   });

   test("coerce", () => {
      const schema = object({
         name: string(),
         age: number(),
      });
      expect(schema.coerce("{}")).toEqual({} as any);
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
         expectTypeOf<Coerced>().toEqualTypeOf<{
            name: "asdf";
            [key: string]: unknown;
         }>();
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
            [key: string]: unknown;
         }>();
      }
   });
});
