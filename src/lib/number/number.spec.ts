import { expectTypeOf } from "expect-type";
import { type Static } from "../static";
import { integer, number } from "./number";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";

describe("number", () => {
   test("basic", () => {
      const schema = number();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<number>();

      assertJson(number(), { type: "number" });

      {
         // optional
         const schema = number().optional();
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<number | undefined>();

         assertJson(schema, { type: "number" });
      }
   });

   test("types", () => {
      // expect to be fine
      number({
         multipleOf: 1,
         maximum: 1,
         exclusiveMaximum: 1,
         minimum: 1,
         exclusiveMinimum: 1,
      });
      // expect fns to work
      number({ coerce: (v) => 0, validate: (v) => null as any });
      // @ts-expect-error maxLength is not a valid property for number
      number({ maxLength: 0 });
      // @ts-expect-error pattern is not a valid property for number
      number({ pattern: "" });
   });

   test("options & type inference", () => {
      {
         // @ts-expect-error minimum must be a number
         number({ minimum: "1" });
      }

      const schema = number({
         minimum: 1,
         maximum: 1,
         multipleOf: 1,
      });

      expectTypeOf<(typeof schema)["minimum"]>().toEqualTypeOf<1>();
      expectTypeOf<(typeof schema)["maximum"]>().toEqualTypeOf<1>();
      expectTypeOf<(typeof schema)["multipleOf"]>().toEqualTypeOf<1>();
   });

   test("with const", () => {
      const schema = number({ const: 1 });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1>();

      assertJson(number({ const: 1 }), {
         type: "number",
         const: 1,
      });
   });

   test("with enum", () => {
      const schema = number({ enum: [1, 2, 3] });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1 | 2 | 3>();

      assertJson(number({ enum: [1, 2, 3] }), {
         type: "number",
         enum: [1, 2, 3],
      });
   });

   test("number schema", () => {
      assertJson(number({ minimum: 1 }), {
         type: "number",
         minimum: 1,
      });
      assertJson(number({ maximum: 1 }), {
         type: "number",
         maximum: 1,
      });
      assertJson(number({ multipleOf: 1 }), {
         type: "number",
         multipleOf: 1,
      });
   });

   test("integer", () => {
      assertJson(integer(), {
         type: "integer",
      });
   });

   describe("validate", () => {
      test("base", () => {
         const schema = number();
         expect(schema.validate(1).valid).toBe(true);
         expect(schema.validate("1").errors[0]?.error).toEqual(
            "Expected number"
         );
         expect(schema.validate(undefined).valid).toBe(true);
         expect(schema.validate(null).errors[0]?.error).toEqual(
            "Expected number"
         );
         expect(schema.validate({}).errors[0]?.error).toEqual(
            "Expected number"
         );
         expect(schema.validate([]).errors[0]?.error).toEqual(
            "Expected number"
         );

         expect(integer().validate(1.5).valid).toEqual(false);
      });

      test("const", () => {
         const schema = number({ const: 1 });
         expect(schema.validate(1).valid).toBe(true);
         expect(schema.validate(2).errors[0]?.error).toEqual(
            "Expected const: 1"
         );
      });

      test("enum", () => {
         const schema = number({ enum: [1, 2, 3] });
         expect(schema.validate(1).valid).toBe(true);
         expect(schema.validate(2).valid).toBe(true);
         expect(schema.validate(3).valid).toBe(true);
         expect(schema.validate(4).errors[0]?.error).toEqual(
            "Expected enum: [1,2,3]"
         );
      });

      test("multipleOf", () => {
         const schema = number({ multipleOf: 2 });
         expect(schema.validate(2).valid).toBe(true);
         expect(schema.validate(3).errors[0]?.error).toEqual(
            "Expected number being a multiple of 2"
         );
         expect(schema.validate(4).valid).toBe(true);
      });

      test("maximum", () => {
         const schema = number({ maximum: 1 });
         expect(schema.validate(1).valid).toBe(true);
         expect(schema.validate(2).errors[0]?.error).toEqual(
            "Expected number less than or equal to 1"
         );
      });

      test("exclusiveMaximum", () => {
         const schema = number({ exclusiveMaximum: 3 });
         expect(schema.validate(3).errors[0]?.error).toEqual(
            "Expected number less than 3"
         );
         expect(schema.validate(2).valid).toBe(true);
      });

      test("minimum", () => {
         const schema = number({ minimum: 1 });
         expect(schema.validate(1).valid).toBe(true);
         expect(schema.validate(0).errors[0]?.error).toEqual(
            "Expected number greater than or equal to 1"
         );
      });

      test("exclusiveMinimum", () => {
         const schema = number({ exclusiveMinimum: 1 });
         expect(schema.validate(1).errors[0]?.error).toEqual(
            "Expected number greater than 1"
         );
         expect(schema.validate(2).valid).toBe(true);
      });
   });

   test("template", () => {
      expect(number().template()).toEqual(undefined as any);
      expect(number({ default: 1 }).template()).toEqual(1);
      expect(number({ const: 1 }).template()).toEqual(1);
   });

   test("coerce", () => {
      expect(number().coerce("1")).toEqual(1);
      expect(number().coerce(1)).toEqual(1);
      expect(number().coerce(true)).toEqual(true);

      // custom coersion
      const schema = number({
         coerce: (v: unknown) => Number(v) * 2,
      });
      expect(schema.coerce("1")).toEqual(2);
   });
});
