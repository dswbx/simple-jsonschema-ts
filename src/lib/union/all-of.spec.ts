import { describe, test, expect } from "bun:test";
import { expectTypeOf } from "expect-type";
import { number, object, string } from "../";
import { assertJson } from "../assert";
import type { Static } from "../static";
import { allOf } from "./all-of";

describe("all of", () => {
   test("basic", () => {
      const schema = allOf([
         object({ test: string() }),
         object({ what: string() }),
      ]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         test: string;
         what: string;
         [key: string]: unknown;
      }>();

      //console.log(JSON.stringify(schema, null, 2));
      assertJson(schema, {
         type: "object",
         required: ["test", "what"],
         properties: {
            test: {
               type: "string",
            },
            what: {
               type: "string",
            },
         },
      });
   });

   test("complex", () => {
      const schema = allOf([
         object({
            bar: number(),
         }),
         object({
            foo: string(),
         }),
      ]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         bar: number;
         foo: string;
         [key: string]: unknown;
      }>();

      expect(schema.toJSON()).toEqual({
         type: "object",
         required: ["bar", "foo"],
         properties: {
            bar: { type: "number" },
            foo: { type: "string" },
         },
      });
   });
});
