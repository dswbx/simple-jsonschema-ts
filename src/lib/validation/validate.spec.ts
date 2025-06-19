import { describe, expect, test } from "bun:test";
import * as s from "../";
import { booleanSchema } from "../schema";
import { fromSchema } from "../";

describe("validate", () => {
   test("error count", () => {
      const result = s.string({ minLength: 10, pattern: "/a/" }).validate("b");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      expect(result.errors[1]?.keywordLocation).toBe("/pattern");

      // console.log(s.string().validate(1));
   });

   test("boolean schema", () => {
      const falsy = booleanSchema(false).validate(undefined);
      expect(falsy.valid).toBe(false);
      expect(falsy.errors.length).toBe(1);
      expect(falsy.errors[0]?.error).toBe("Always fails");

      const truthy = booleanSchema(true).validate(undefined);
      expect(truthy.valid).toBe(true);
      expect(truthy.errors.length).toBe(0);
   });

   test("multiple vs single errors", () => {
      const result = s
         .string({ minLength: 10, pattern: "^[0-9]+$" })
         .validate("what");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      expect(result.errors[1]?.keywordLocation).toBe("/pattern");

      {
         const result = s
            .string({ minLength: 10, pattern: "^[0-9]+$" })
            .validate("what", {
               shortCircuit: true,
            });
         expect(result.valid).toBe(false);
         expect(result.errors.length).toBe(1);
         expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      }
   });

   test("multiple types", () => {
      const multi = fromSchema({ type: ["string", "number"] });
      expect(multi.validate("hello").valid).toBe(true);
      expect(multi.validate(1).valid).toBe(true);
      expect(multi.validate(true).errors[0]?.keywordLocation).toBe("/type");
   });

   test.skip("ref", () => {
      const schema = s.object({
         foo: s.refId("#").optional(),
      });

      expect(
         schema.validate(
            { foo: { foo: {} } },
            {
               ignoreUnsupported: true,
            }
         ).valid
      ).toBe(true);
      expect(schema.toJSON()).toEqual({
         type: "object",
         properties: {
            foo: { $ref: "#" },
         },
      });
   });
});
