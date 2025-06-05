import { expectTypeOf } from "expect-type";
import type { Static, StaticCoerced } from "../static";
import { object } from "./object";
import { record } from "./record";
import { type TSchema } from "../schema";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, boolean, array, anyOf, any } from "../";

describe("record", () => {
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
});
