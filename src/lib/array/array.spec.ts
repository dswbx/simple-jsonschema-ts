import { expectTypeOf } from "expect-type";
import type { Static, StaticCoerced } from "../static";
import { array } from "./array";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, object, any } from "../";

describe("array", () => {
   test("basic with string", () => {
      {
         const schema = array(string());
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<string[]>();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<string[]>();
      }
      {
         const schema = array(string({ const: "hello" }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<"hello"[]>();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<"hello"[]>();
      }
      {
         const schema = array(string({ enum: ["hello", "world"] }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<("hello" | "world")[]>();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<("hello" | "world")[]>();
      }

      assertJson(array(string()), {
         type: "array",
         items: { type: "string" },
      });
   });

   test("basic with number", () => {
      {
         const schema = array(number());
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<number[]>();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<number[]>();
      }
      {
         const schema = array(number({ const: 1 }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<1[]>();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<1[]>();
      }
      {
         const schema = array(number({ enum: [1, 2, 3] }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<(1 | 2 | 3)[]>();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<(1 | 2 | 3)[]>();
      }

      assertJson(array(number()), {
         type: "array",
         items: { type: "number" },
      });
   });

   test("with objects", () => {
      const schema = array(
         object({ name: string().optional(), age: number() })
      );
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<
         { name?: string; age: number; [key: string]: unknown }[]
      >();

      assertJson(schema, {
         type: "array",
         items: {
            type: "object",
            properties: { name: { type: "string" }, age: { type: "number" } },
            required: ["age"],
         },
      });
   });

   test("contains", () => {
      const schema = array(string(), { contains: string() });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string[]>();

      assertJson(schema, {
         type: "array",
         items: { type: "string" },
         contains: { type: "string" },
      });
   });

   describe("empty array", () => {
      const s = array();
      type Inferred = Static<typeof s>;
      expectTypeOf<Inferred>().toEqualTypeOf<unknown[]>();
      type Coerced = StaticCoerced<typeof s>;
      expectTypeOf<Coerced>().toEqualTypeOf<unknown[]>();

      assertJson(s, {
         type: "array",
      });

      {
         // specific coercion
         const s2 = array(undefined, {
            coerce: () => [] as number[],
         });
         type Inferred2 = Static<typeof s2>;
         expectTypeOf<Inferred2>().toEqualTypeOf<unknown[]>();
         type Coerced2 = StaticCoerced<typeof s2>;
         expectTypeOf<Coerced2>().toEqualTypeOf<number[]>();
      }
   });

   describe("validate", () => {
      test("base", () => {
         const schema = array(string());
         expect(schema.validate({}).errors[0]?.error).toEqual("Expected array");
      });

      test("minItems", () => {
         const schema = array(string(), { minItems: 2 });
         expect(schema.validate(["a"]).errors[0]?.error).toEqual(
            "Expected array with at least 2 items"
         );
         expect(schema.validate(["a", "b"]).valid).toBe(true);
      });

      test("maxItems", () => {
         const schema = array(string(), { maxItems: 2 });
         expect(schema.validate(["a", "b", "c"]).errors[0]?.error).toEqual(
            "Expected array with at most 2 items"
         );
         expect(schema.validate(["a", "b"]).valid).toBe(true);
      });

      test("contains", () => {
         const schema = array(string(), { contains: string() });
         expect(schema.validate(["a", "b"]).valid).toBe(true);
         expect(schema.validate(["a", "b", 1]).valid).toBe(false);
         expect(schema.validate([2, 1]).valid).toBe(false);
      });
   });

   test("template", () => {
      const schema = array(string());
      expect(schema.template()).toEqual([]);
   });

   test("coerce", () => {
      {
         // expect nothing to happen, including no error
         expect(array().coerce("")).toBe("");
      }

      {
         const schema = array(string());
         expect(schema.coerce("[]")).toEqual([]);
         expect(schema.coerce("[1]")).toEqual(["1"]);
         expect(schema.coerce(["a", "1"])).toEqual(["a", "1"]);
      }

      {
         const schema = array(number());
         expect(schema.coerce("[]")).toEqual([]);
         expect(schema.coerce("[1]")).toEqual([1]);
         expect(schema.coerce(["1", "2"])).toEqual([1, 2]);
      }

      {
         const s = string({ coerce: () => "" as unknown as "one" | "two" });
         const schema = array(s);
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<("one" | "two")[]>();
      }
   });
});
