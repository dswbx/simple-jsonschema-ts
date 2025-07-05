import { describe, expect, test } from "bun:test";
import { IStringOptions, StringSchema } from "../lib/string/string";
import { object } from "../lib/object/object";
import { Static, StaticCoerced } from "../lib/static";
import { expectTypeOf } from "expect-type";
describe("custom", () => {
   test("custom string", () => {
      class CustomString<
         const O extends IStringOptions
      > extends StringSchema<O> {}

      const customString = new CustomString({});
      type Inferred = Static<typeof customString>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();
      type Coerced = StaticCoerced<typeof customString>;
      expectTypeOf<Coerced>().toEqualTypeOf<string>();

      {
         const schema = object({
            name: customString.optional(),
            surname: customString,
         });
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<{
            [key: string]: unknown;
            name?: string;
            surname: string;
         }>();
         type Coerced = StaticCoerced<typeof schema>;
         expectTypeOf<Coerced>().toEqualTypeOf<{
            [key: string]: unknown;
            name?: string;
            surname: string;
         }>();
      }
   });
});
