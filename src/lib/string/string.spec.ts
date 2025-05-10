import { expectTypeOf } from "expect-type";
import { type Static } from "../base";
import { string, stringConst } from "./string";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { error, valid } from "../utils/details";

describe("string", () => {
   test("basic", () => {
      const schema = string();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();

      assertJson(string(), { type: "string" });
   });

   test("with const", () => {
      const schema = string({ const: "hello" });

      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"hello">();

      assertJson(string({ const: "hello" }), {
         type: "string",
         const: "hello",
      });
   });

   test("with enum", () => {
      const schema = string({ enum: ["a", "b", "c"] });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"a" | "b" | "c">();

      assertJson(string({ enum: ["a", "b", "c"] }), {
         type: "string",
         enum: ["a", "b", "c"],
      });
   });

   test("string schema", () => {
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

   test("stringConst", () => {
      const schema = stringConst({ const: "hello" });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"hello">();

      assertJson(schema, {
         type: "string",
         const: "hello",
         default: "hello",
         readOnly: true,
      });
   });

   describe("validate", () => {
      test("base", () => {
         const schema = string();
         expect(schema.validate("hello").valid).toBe(true);
         expect(schema.validate(1).valid).toBe(false);
         expect(schema.validate(undefined).valid).toBe(false);
         expect(schema.validate(null).valid).toBe(false);
         expect(schema.validate({}).valid).toBe(false);
         expect(schema.validate([]).valid).toBe(false);
      });

      test("const", () => {
         const schema = stringConst({ const: "hello" });
         expect(schema.validate("hello").valid).toBe(true);
         expect(schema.validate("world").errors[0]?.keywordLocation).toEqual(
            "/const"
         );
      });

      test("enum", () => {
         const schema = string({ enum: ["a", "b", "c"] });
         expect(schema.validate("a").valid).toBe(true);
         expect(schema.validate("b").valid).toBe(true);
         expect(schema.validate("c").valid).toBe(true);
         expect(schema.validate("d").errors[0]?.keywordLocation).toEqual(
            "/enum"
         );
      });

      test("pattern", () => {
         const schema = string({ pattern: "/a/" });
         expect(schema.validate("a").valid).toBe(true);
         expect(schema.validate("b").errors[0]?.keywordLocation).toEqual(
            "/pattern"
         );
      });

      test("minLength", () => {
         const schema = string({ minLength: 3 });
         expect(schema.validate("a").errors[0]?.keywordLocation).toEqual(
            "/minLength"
         );
         expect(schema.validate("ab").errors[0]?.keywordLocation).toEqual(
            "/minLength"
         );
         expect(schema.validate("abc").valid).toBe(true);
      });

      test("maxLength", () => {
         const schema = string({ maxLength: 3 });
         expect(schema.validate("a").valid).toBe(true);
         expect(schema.validate("ab").valid).toBe(true);
         expect(schema.validate("abc").valid).toBe(true);
         expect(schema.validate("abcd").errors[0]?.keywordLocation).toEqual(
            "/maxLength"
         );
      });

      test("mixed", () => {
         {
            const result = string({ maxLength: 2, minLength: 4 }).validate(
               "foobar"
            );
            expect(result.valid).toBe(false);
         }
      });

      test("custom", () => {
         const schema = string({
            minLength: 3,
            validate: (value, opts) => {
               if (value === "throw") return error(opts, "minLength", "throw");
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
      expect(string().template()).toEqual("");
      expect(string({ default: "hello" }).template()).toEqual("hello");
      expect(string({ const: "hello" }).template()).toEqual("hello");
   });

   test("coerce", () => {
      expect(string().coerce("hello")).toEqual("hello");
      expect(string().coerce(1)).toEqual("1");
      expect(string().coerce(true)).toEqual("true");
      expect(string().coerce(false)).toEqual("false");

      // custom coersion
      expect(
         string({
            coerce: (value) => String(value) + "!",
         }).coerce("hello")
      ).toEqual("hello!");
   });
});
