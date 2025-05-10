import { expectTypeOf } from "expect-type";
import type { Static } from "../base";
import { any } from "../misc/any";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";

describe(any, () => {
   test("basic", () => {
      const schema = any();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<any>();
      assertJson(schema, {});
   });

   test("const", () => {
      const schema = any({ const: "hello" });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"hello">();
      assertJson(schema, { const: "hello" });
   });

   test("enum", () => {
      const schema = any({ enum: ["hello", "world"] });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"hello" | "world">();
      assertJson(schema, { enum: ["hello", "world"] });
   });

   test("mix props", () => {
      // min length is a string keyword -> valid
      expect(any({ minLength: 2 }).validate(1).valid).toBe(true);
      // min length is a number keyword -> invalid
      expect(any({ minLength: 2 }).validate("a").valid).toBe(false);
   });
});
