import { test, describe, expect } from "bun:test";
import {
   isArray,
   isBoolean,
   isNumber,
   isObject,
   isString,
   isValidPropertyName,
} from ".";

describe("utils", () => {
   test("isObject", () => {
      [{}].map((v) => {
         expect(isObject(v)).toBe(true);
      });

      [null, [], 1, "", true, false, undefined].map((v) => {
         expect(isObject(v)).toBe(false);
      });
   });

   test("isString", () => {
      ["", "hello"].map((v) => {
         expect(isString(v)).toBe(true);
      });

      [null, [], 1, true, false, undefined].map((v) => {
         expect(isString(v)).toBe(false);
      });
   });

   test("isNumber", () => {
      [1, 1.1].map((v) => {
         expect(isNumber(v)).toBe(true);
      });

      [null, [], "1", true, false, undefined].map((v) => {
         expect(isNumber(v)).toBe(false);
      });
   });

   test("isBoolean", () => {
      [true, false].map((v) => {
         expect(isBoolean(v)).toBe(true);
      });

      [null, [], "1", 1, undefined].map((v) => {
         expect(isBoolean(v)).toBe(false);
      });
   });

   test("isArray", () => {
      [[]].map((v) => {
         expect(isArray(v)).toBe(true);
      });

      [null, {}, 1, "1", true, false, undefined].map((v) => {
         expect(isArray(v)).toBe(false);
      });
   });

   test("isValidPropertyName", () => {
      ["hello"].map((v) => {
         expect(isValidPropertyName(v)).toBe(true);
      });

      [" ab", "", 1, true].map((v) => {
         expect(isValidPropertyName(v)).toBe(false);
      });
   });
});
