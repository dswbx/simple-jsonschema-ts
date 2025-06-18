import { expect } from "bun:test";
import type { SchemaType } from "./schema";

export const assertJson = (
   schema: SchemaType | { static: any },
   expected: object | boolean
) => {
   const json = JSON.parse(JSON.stringify(schema));
   expect(json).toEqual(expected);
};
