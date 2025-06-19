import { describe, test } from "bun:test";
import { expectTypeOf } from "expect-type";
import type { OptionalUndefined, Static } from "./static";
import { Schema } from "./schema";

describe("static", () => {
   test("base", () => {
      expectTypeOf<Static<Schema<{}, 1, 1>>>().toEqualTypeOf<1>();
      expectTypeOf<Static<Schema<{}, true>>>().toEqualTypeOf<true>();
      expectTypeOf<Static<Schema<{}, boolean>>>().toEqualTypeOf<boolean>();
   });

   test("OptionalUndefined", () => {
      type A = {
         a: string;
         b: number | undefined;
      };

      type A_ = OptionalUndefined<A>;
      //   ^?
      expectTypeOf<A_>().toEqualTypeOf<{
         a: string;
         b?: number;
      }>();
   });
});
