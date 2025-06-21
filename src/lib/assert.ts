import { expect } from "bun:test";
import type { Schema } from "./schema";

export const assertJson = (schema: Schema, expected: object | boolean) => {
   const json = JSON.parse(JSON.stringify(schema));
   expect(json).toEqual(expected);
};
