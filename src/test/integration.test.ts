import { describe, expect, test } from "bun:test";
import * as s from "../lib";
import { expectTypeOf } from "expect-type";
import { assertJson } from "../lib/assert";
import { StandardSchemaV1 } from "../lib/types";

describe("integration", () => {
   test("array with string enum", () => {
      const schema = s.array(s.string({ enum: ["a", "b"] }));
      type Inferred = s.Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<("a" | "b")[]>();

      assertJson(schema, {
         type: "array",
         items: { type: "string", enum: ["a", "b"] },
      });
   });

   test("array with string enum (const)", () => {
      const schema = s.array(s.string({ enum: ["a", "b"] as const }));
      type Inferred = s.Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<("a" | "b")[]>();

      assertJson(schema, {
         type: "array",
         items: { type: "string", enum: ["a", "b"] },
      });
   });

   test("complex object with anyOf and array", () => {
      const skills = s.array(s.string({ enum: ["a", "b"] }));
      const schema = s.object({
         name: s.anyOf([s.string(), s.number()]),
         skills: s.anyOf([skills, s.boolean()]),
      });
      type Inferred = s.Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name: string | number;
         skills: boolean | ("a" | "b")[];
         [key: string]: unknown;
      }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: {
               anyOf: [{ type: "string" }, { type: "number" }],
            },
            skills: {
               anyOf: [
                  {
                     type: "array",
                     items: { type: "string", enum: ["a", "b"] },
                  },
                  { type: "boolean" },
               ],
            },
         },
         required: ["name", "skills"],
      });
   });

   test("standard schema", () => {
      const schema = s.object({
         name: s.string(),
      });
      type Input = StandardSchemaV1.InferInput<typeof schema>;
      type Output = StandardSchemaV1.InferOutput<typeof schema>;
      expectTypeOf<Input>().toEqualTypeOf<{
         [key: string]: unknown;
         name: string;
      }>();
      expectTypeOf<Output>().toEqualTypeOf<{
         [key: string]: unknown;
         name: string;
      }>();

      expect(schema["~standard"].validate({ name: "John" })).toEqual({
         value: { name: "John" },
      });

      expect(schema["~standard"].validate({ name: 123 })).toEqual({
         issues: [
            {
               message: "Expected string",
               path: ["name"],
            },
         ],
      });
   });
});
