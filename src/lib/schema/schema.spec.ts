import { describe, expect, test } from "bun:test";
import type { Static } from "../static";
import { SchemaType } from "../schema";
import { expectTypeOf } from "expect-type";
import { assertJson } from "../assert";

describe("schema", () => {
   test("true/false schemas", () => {
      const s = SchemaType.true();
      type Inferred = Static<typeof s>;
      expectTypeOf<Inferred>().toEqualTypeOf<unknown>();
      assertJson(s, {});
      expect(s.validate(undefined).valid).toBe(true);

      const s2 = SchemaType.false();
      type Inferred2 = Static<typeof s2>;
      expectTypeOf<Inferred2>().toEqualTypeOf<never>();
      assertJson(s2, {});
      expect(s2.validate(undefined).valid).toBe(false);
   });
});
