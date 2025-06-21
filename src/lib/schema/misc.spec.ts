import { describe, expect, test } from "bun:test";
import { any, literal } from "./misc";
import { expectTypeOf } from "expect-type";
import type { Static, StaticCoerced } from "../static";
import { assertJson } from "../assert";
import { object } from "../object/object";
import { string } from "../string/string";
import { array } from "../array/array";
import type { symbol } from "./schema";

describe("any", () => {
   test("base", () => {
      const schema = any();
      type Inferred2 = (typeof schema)[typeof symbol]["static"];
      expectTypeOf<Inferred2>().toEqualTypeOf<any>();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<any>();
      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Coerced>().toEqualTypeOf<any>();

      assertJson(schema, {});
   });

   test("optional in object", () => {
      const schema = object({
         name: any().optional(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name?: any;
         [key: string]: unknown;
      }>();
      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Coerced>().toEqualTypeOf<{
         name?: any;
         [key: string]: unknown;
      }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: {},
         },
      });
   });
});

describe("literal", () => {
   test("base", () => {
      const schema = literal(1);
      type W = (typeof schema)[typeof symbol]["static"];
      expectTypeOf<W>().toEqualTypeOf<1>();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1>();
      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Coerced>().toEqualTypeOf<1>();
      assertJson(schema, { const: 1 });

      expect(schema.const).toBe(1);
      expectTypeOf<typeof schema.const>().toEqualTypeOf<1>();
   });

   test("primitives", () => {
      const o = literal({ name: "hello" });
      expectTypeOf<Static<typeof o>>().toEqualTypeOf<{
         readonly name: "hello";
      }>();
      const n = literal(null);
      expectTypeOf<Static<typeof n>>().toEqualTypeOf<null>();
      const u = literal(undefined);
      expectTypeOf<Static<typeof u>>().toEqualTypeOf<undefined>();
      const bt = literal(true);
      expectTypeOf<Static<typeof bt>>().toEqualTypeOf<true>();
      const bf = literal(false);
      expectTypeOf<Static<typeof bf>>().toEqualTypeOf<false>();
      const s = literal("hello");
      expectTypeOf<Static<typeof s>>().toEqualTypeOf<"hello">();
      const a = literal([1, "2", true]);
      expectTypeOf<Static<typeof a>>().toEqualTypeOf<readonly [1, "2", true]>();
   });

   test("with props", () => {
      // @ts-expect-error const should not be reused
      literal(1, { const: 1 });

      const schema = literal(1, {
         title: "number",
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1>();
      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Coerced>().toEqualTypeOf<1>();

      assertJson(schema, { const: 1, title: "number" });
   });

   test("prevent exotic", () => {
      // @ts-expect-error only primitives allowed
      literal(object({ name: string() }));
      // @ts-expect-error only primitives allowed
      literal(array(string()));
   });
});
