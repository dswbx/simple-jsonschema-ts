import { describe, expect, test } from "bun:test";
import type { Static, StaticCoerced } from "../static";
import { SchemaType } from "../schema";
import { expectTypeOf } from "expect-type";
import { assertJson } from "../assert";

describe("schema", () => {
   test("true/false schemas", () => {
      const s = SchemaType.true();
      type Inferred = Static<typeof s>;
      expectTypeOf<Inferred>().toEqualTypeOf<unknown>();
      assertJson(s, true);
      expect(s.validate(undefined).valid).toBe(true);

      const s2 = SchemaType.false();
      type Inferred2 = Static<typeof s2>;
      expectTypeOf<Inferred2>().toEqualTypeOf<never>();
      assertJson(s2, false);
      expect(s2.validate(undefined).valid).toBe(false);
   });

   test("coerce", () => {
      type S = SchemaType<{}, 1, 2>;
      type S_Static = Static<S>;
      expectTypeOf<S_Static>().toEqualTypeOf<1>();
      type S_Coerced = StaticCoerced<S>;
      expectTypeOf<S_Coerced>().toEqualTypeOf<2>();

      {
         type S = SchemaType<{ coerce: (v: unknown) => string }, number>;
         type S_Static = Static<S>;
         expectTypeOf<S_Static>().toEqualTypeOf<number>();
         type S_Coerced = StaticCoerced<S>;
         expectTypeOf<S_Coerced>().toEqualTypeOf<string>();
      }

      {
         type S = SchemaType<{ const: "what" }, number, string>;
         type S_Static = Static<S>;
         expectTypeOf<S_Static>().toEqualTypeOf<"what">();
         type S_Coerced = StaticCoerced<S>;
         expectTypeOf<S_Coerced>().toEqualTypeOf<"what">();
      }
   });
});
