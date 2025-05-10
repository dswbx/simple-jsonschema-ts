import { Validator } from "@cfworker/json-schema";
import * as s from "../lib";
import { describe, expect, test } from "bun:test";
import Ajv from "ajv";

const schemas = [
   {
      name: "simple object",
      schema: s.object({
         name: s.string(),
      }),
      data: [
         [{ name: "John" }, true],
         [{ name: 1 }, false],
      ],
   },
   {
      name: "object with optional",
      schema: s.object({
         name: s.string().optional(),
         age: s.number({ minimum: 18 }),
      }),
      data: [
         [{ name: "John", age: 20 }, true],
         [{ name: "John", age: 17 }, false],
         [{ age: 18 }, true],
         [{}, false],
      ],
   },
] as const;

function cleanSchema(schema: s.TSchema) {
   return JSON.parse(JSON.stringify(schema));
}

const validators: {
   name: string;
   validate: (schema: s.TSchema, data: any) => boolean;
}[] = [
   {
      name: "@cfworker/json-schema",
      validate: (schema: s.TSchema, data: any) => {
         return new Validator(cleanSchema(schema)).validate(data).valid;
      },
   },
   {
      name: "ajv",
      validate: (schema: s.TSchema, data: any) => {
         const ajv = new Ajv();
         return ajv.validate(schema, data);
      },
   },
] as const;

describe("validation", () => {
   for (const { name, validate } of validators) {
      describe(name, () => {
         for (const { name, schema, data } of schemas) {
            test(name, () => {
               for (const [_data, valid] of data) {
                  const result = validate(cleanSchema(schema), _data);
                  expect(result).toBe(valid);
               }
            });
         }
      });
   }
});
