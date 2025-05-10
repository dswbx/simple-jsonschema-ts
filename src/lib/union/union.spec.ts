import { expectTypeOf } from "expect-type";
import { type Static } from "../base";
import { $kind } from "../symbols";
import { allOf, anyOf, oneOf } from "./union";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, object, array } from "../";

describe("union", () => {
   test("anyOf", () => {
      const schema = anyOf([string(), number()]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number>();

      expect<any>(schema[$kind]).toEqual("anyOf");

      assertJson(schema, {
         anyOf: [{ type: "string" }, { type: "number" }],
      });
   });

   test("anyOf with arrays", () => {
      const schema = anyOf([string(), number(), array(string())]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number | string[]>();

      assertJson(schema, {
         anyOf: [
            { type: "string" },
            { type: "number" },
            { type: "array", items: { type: "string" } },
         ],
      });
   });

   test("oneOf", () => {
      const schema = oneOf([string(), number()]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number>();

      expect<any>(schema[$kind]).toEqual("oneOf");

      assertJson(schema, {
         oneOf: [{ type: "string" }, { type: "number" }],
      });
   });

   // use with caution!
   test("allOf", () => {
      const schema = allOf([
         object({ test: string() }),
         object({ what: string() }),
      ]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         test: string;
         what: string;
      }>();

      assertJson(schema, {
         allOf: [
            {
               type: "object",
               properties: { test: { type: "string" } },
               required: ["test"],
            },
            {
               type: "object",
               properties: { what: { type: "string" } },
               required: ["what"],
            },
         ],
      });
   });

   test("template", () => {
      const schema = anyOf([string(), number()], { default: 1 });
      expect(schema.template()).toEqual(1);
   });

   describe("validate", () => {
      test("matches", () => {
         expect(
            anyOf([
               string({ minLength: 3 }),
               string({ minLength: 4 }),
               string({ minLength: 7 }),
            ])
               .matches("hello")
               .map((s) => ({
                  type: s.type,
                  // @ts-ignore
                  minLength: s.minLength,
               }))
         ).toEqual([
            { type: "string", minLength: 3 },
            { type: "string", minLength: 4 },
         ]);
      });

      test("validate", () => {
         expect(
            anyOf([array(string()), number()]).validate("hello").errors[0]
               ?.error
         ).toEqual("Expected at least one to match");

         string().optional();

         expect(anyOf([string(), number()]).validate(1).valid).toBe(true);
      });
   });
});
