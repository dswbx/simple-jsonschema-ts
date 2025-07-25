import { expectTypeOf } from "expect-type";
import { type Static, type StaticCoerced } from "../static";
import { string } from "./string";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { error, valid } from "../utils/details";

describe("string", () => {
   test("basic", () => {
      const schema = string();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();

      assertJson(string(), { type: "string" });

      {
         // optional
         const schema = string().optional();
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<string | undefined>();

         assertJson(schema, { type: "string" });
      }
   });

   test("types", () => {
      // expect to be fine
      string({ maxLength: 1, minLength: 1, pattern: "", format: "" });
      // expect fns to work
      string({ coerce: (v) => "", validate: (v) => null as any });
      // @ts-expect-error minimum is not a valid property for string
      string({ minimum: 0 });
      // @ts-expect-error anyOf is not a valid property for string
      string({ anyOf: [] });
   });

   test("options & type inference", () => {
      {
         // @ts-expect-error maxLength must be a number
         string({ maxLength: "1" });
      }

      const schema = string({
         minLength: 1,
         pattern: "/a/",
      });

      expectTypeOf<(typeof schema)["pattern"]>().toEqualTypeOf<"/a/">();
      expectTypeOf<(typeof schema)["minLength"]>().toEqualTypeOf<1>();
   });

   test("with const", () => {
      const schema = string({ const: "hello" });

      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"hello">();

      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Coerced>().toEqualTypeOf<"hello">();

      assertJson(schema, {
         type: "string",
         const: "hello",
      });
   });

   test("with enum", () => {
      const schema = string({ enum: ["a", "b", "c"] });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"a" | "b" | "c">();

      assertJson(schema, {
         type: "string",
         enum: ["a", "b", "c"],
      });
   });

   test("string schema", () => {
      assertJson(string(), { type: "string" });
      assertJson(string({ minLength: 1 }), {
         type: "string",
         minLength: 1,
      });
      assertJson(string({ maxLength: 1 }), {
         type: "string",
         maxLength: 1,
      });
      assertJson(string({ pattern: "/a/" }), {
         type: "string",
         pattern: "/a/",
      });
   });

   describe("validate", () => {
      test("mixed", () => {
         {
            const result = string({ maxLength: 2, minLength: 4 }).validate(
               "foobar"
            );
            expect(result.valid).toBe(false);
         }
      });

      test("pattern", () => {
         // allows javascript regex
         const email = string({
            pattern: /^[\w-\.\+_]+@([\w-]+\.)+[\w-]{2,4}$/,
         });
         expect(email.validate("test@test.com").valid).toBe(true);
         expect(email.validate("..").valid).toBe(false);
         expect(email.toJSON()).toEqual({
            type: "string",
            pattern: "^[\\w-\\.\\+_]+@([\\w-]+\\.)+[\\w-]{2,4}$",
         });
      });

      test("custom", () => {
         const schema = string({
            minLength: 3,
            validate: (value, opts) => {
               if (value === "throw") return error(opts, "validate", "throw");
               return valid();
            },
         });
         expect(schema.validate("a").errors[0]?.keywordLocation).toEqual(
            "/minLength"
         );
         expect(schema.validate("abcd").valid).toBe(true);
         expect(schema.validate("throw").errors[0]?.error).toEqual("throw");
      });
   });

   test("template", () => {
      expect(
         string().template(undefined, { withExtendedOptional: true })
      ).toEqual("");
      expect(string({ default: "hello" }).template()).toEqual("hello");
      expect(string({ const: "hello" }).template()).toEqual("hello");

      // ignores no strings
      //expect(string().template(1)).toEqual("");
   });

   test("coerce", () => {
      expect(string().coerce("hello")).toEqual("hello");
      expect(string().coerce(1)).toEqual("1");

      // custom coersion
      expect(
         string({
            coerce: (value) => String(value) + "!",
         }).coerce("hello")
      ).toEqual("hello!");

      // with props
      const schema = string({
         pattern: "/a/",
         coerce: () => "value" as const,
      });
      type Inferred = Static<typeof schema>;
      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();
      expectTypeOf<Coerced>().toEqualTypeOf<"value">();
   });
});
