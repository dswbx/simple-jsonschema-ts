import { describe, expect, test } from "bun:test";
import { allKeywords, getTypeKeywords, validateTypeKeywords } from "./validate";
import * as s from "../";
import type { TSchema } from "../";

describe("validate", () => {
   test.skip("allKeywords", () => {
      console.log(allKeywords);
   });

   test("getTypeKeywords", () => {
      const get = (s: TSchema) => Object.keys(getTypeKeywords(s) ?? {});

      (
         [
            [
               s.string(),
               ["type", "const", "enum", "pattern", "minLength", "maxLength"],
            ],
            [
               s.number(),
               [
                  "type",
                  "const",
                  "enum",
                  "multipleOf",
                  "maximum",
                  "exclusiveMaximum",
                  "minimum",
                  "exclusiveMinimum",
               ],
            ],
            [
               s.integer(),
               [
                  "type",
                  "const",
                  "enum",
                  "multipleOf",
                  "maximum",
                  "exclusiveMaximum",
                  "minimum",
                  "exclusiveMinimum",
               ],
            ],
            [
               s.object({}),
               [
                  "type",
                  "const",
                  "enum",
                  "required",
                  "minProperties",
                  "maxProperties",
                  "propertyNames",
                  "properties",
                  "patternProperties",
                  "additionalProperties",
               ],
            ],
            [
               s.array(s.any()),
               [
                  "type",
                  "const",
                  "enum",
                  "minItems",
                  "maxItems",
                  "uniqueItems",
                  "contains",
                  "prefixItems",
                  "items",
               ],
            ],
         ] as const
      ).map(([schema, expected]) => {
         const result = get(schema);
         expect(
            result,
            `schema ${schema.type} should have keywords ${expected.join(
               ", "
            )} but got ${result.join(", ")}`
         ).toEqual(expected as any);
      });
   });

   test("validateTypeKeywords", () => {
      const validate = (schema: TSchema, value: unknown) =>
         validateTypeKeywords(schema, value);

      {
         expect(validate(s.string(), "hello").valid).toBe(true);
         expect(validate(s.string(), 1).errors[0]?.keywordLocation).toBe(
            "/type"
         );
         expect(
            validate(s.string({ minLength: 1 }), "").errors[0]?.keywordLocation
         ).toBe("/minLength");
         expect(validate(s.string({ minLength: 1 }), "123").valid).toBe(true);
         expect(
            validate(s.string({ maxLength: 1 }), "123").errors[0]
               ?.keywordLocation
         ).toBe("/maxLength");
         expect(
            validate(s.string({ maxLength: 1 }), "1234").errors[0]
               ?.keywordLocation
         ).toBe("/maxLength");
         expect(validate(s.string({ pattern: "^[0-9]+$" }), "123").valid).toBe(
            true
         );
         expect(
            validate(s.string({ pattern: "^[0-9]+$" }), "abc").errors[0]
               ?.keywordLocation
         ).toBe("/pattern");
      }

      {
         expect(validate(s.number(), "123").errors[0]?.keywordLocation).toBe(
            "/type"
         );
         expect(
            validate(s.number({ multipleOf: 2 }), 1).errors[0]?.keywordLocation
         ).toBe("/multipleOf");
         expect(validate(s.number({ multipleOf: 2 }), 2).valid).toBe(true);
         expect(
            validate(s.number({ multipleOf: 2 }), 3).errors[0]?.keywordLocation
         ).toBe("/multipleOf");
         expect(validate(s.number({ maximum: 1 }), 0).valid).toBe(true);
         expect(
            validate(s.number({ maximum: 1 }), 2).errors[0]?.keywordLocation
         ).toBe("/maximum");
         expect(
            validate(s.number({ exclusiveMaximum: 1 }), 1).errors[0]
               ?.keywordLocation
         ).toBe("/exclusiveMaximum");
         expect(validate(s.number({ minimum: 1 }), 1).valid).toBe(true);
         expect(
            validate(s.number({ minimum: 1 }), 0).errors[0]?.keywordLocation
         ).toBe("/minimum");
         expect(
            validate(s.number({ exclusiveMinimum: 1 }), 1).errors[0]
               ?.keywordLocation
         ).toBe("/exclusiveMinimum");
      }

      {
         // objects
         expect(
            s
               .object({
                  test: s.string({ minLength: 10 }),
               })
               .validate({
                  test: "123",
               })
         ).toEqual({
            valid: false,
            errors: [
               {
                  keywordLocation: "/properties/test/minLength",
                  instanceLocation: "/test",
                  error: "Expected string with minimum length of 10",
                  data: "123",
               },
            ],
         });

         expect(
            s
               .object({
                  nested: s.object({
                     test: s.string({ minLength: 10 }),
                  }),
               })
               .validate({
                  nested: {
                     test: "123",
                  },
               })
         ).toEqual({
            valid: false,
            errors: [
               {
                  keywordLocation:
                     "/properties/nested/properties/test/minLength",
                  instanceLocation: "/nested/test",
                  error: "Expected string with minimum length of 10",
                  data: "123",
               },
            ],
         });
      }
   });
});
