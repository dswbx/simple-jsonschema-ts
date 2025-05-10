import { expectTypeOf } from "expect-type";
import type { Static } from "../base";
import { booleanSchema } from "../misc/misc";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";

describe("misc", () => {
   describe(booleanSchema, () => {
      test("true", () => {
         const schema = booleanSchema(true);
         expect(JSON.stringify(schema)).toEqual("true");
         expect(schema.validate({ something: 1 }).valid).toBe(true);
      });

      test("false", () => {
         const schema = booleanSchema(false);
         expect(JSON.stringify(schema)).toEqual("false");
         expect(schema.validate({ something: 1 }).valid).toBe(false);
      });
   });
});
