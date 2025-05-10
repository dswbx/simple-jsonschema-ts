import { expectTypeOf } from "expect-type";
import { type Static, type TSchema } from "../base";
import { ref } from "./ref";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number } from "../";
import { $kind } from "../symbols";

describe("ref", () => {
   test("basic", () => {
      const referenced = string({ $id: "string" });
      const schema = ref(referenced);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();

      expect<any>(schema[$kind]).toEqual("ref");
      expect<any>(schema.$ref).toEqual("#/$defs/string");
      assertJson(schema, {
         $ref: "#/$defs/string",
      });
   });

   test("checks $id", () => {
      expect(() => ref(string())).toThrow();
   });

   test("prefix", () => {
      const schema = ref(string({ $id: "string" }), "definitions");
      expect(schema.$ref).toEqual("#/definitions/string");
   });
});
