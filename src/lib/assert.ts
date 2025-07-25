import { expect } from "bun:test";
import type { Schema } from "./schema";

export const assertJson = (schema: Schema, expected: object | boolean) => {
   expect(schema.toJSON()).toEqual(expected);
};
