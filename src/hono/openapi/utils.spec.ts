import { describe, test, expect } from "bun:test";
import { schemaToSpec } from "./utils";
import * as s from "../../lib";

describe("openapi utils", () => {
   test("schemaToSpec", () => {
      expect(
         schemaToSpec(
            s.object({
               name: s.string(),
               age: s.number().optional(),
            }),
            "query"
         )
      ).toEqual({
         parameters: [
            {
               name: "name",
               in: "query",
               required: true,
               description: undefined,
               schema: {
                  type: "string",
               },
            },
            {
               name: "age",
               in: "query",
               required: undefined,
               description: undefined,
               schema: {
                  type: "number",
               },
            },
         ],
      });

      expect(
         schemaToSpec(
            s.object({
               file: s.string({ format: "binary" }),
            }),
            "form"
         )
      ).toEqual({
         requestBody: {
            content: {
               "multipart/form-data": {
                  schema: {
                     type: "object",
                     properties: {
                        file: {
                           type: "string",
                           format: "binary",
                        },
                     },
                     required: ["file"],
                  },
                  example: undefined,
               },
            },
         },
      });

      expect(
         schemaToSpec(
            s.object({
               payload: s.string(),
            }),
            "json"
         )
      ).toEqual({
         requestBody: {
            content: {
               "application/json": {
                  schema: {
                     type: "object",
                     properties: {
                        payload: {
                           type: "string",
                        },
                     },
                     required: ["payload"],
                  },
                  example: {
                     payload: "",
                  },
               },
            },
         },
      });
   });
});
