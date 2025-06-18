import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { describeRoute, openAPISpecs } from "./openapi";
import { validator } from "../middleware";
import * as s from "../../lib";
import { schemaToSpec } from "./utils";

const sub = new Hono().get(
   "/",
   validator("query", s.object({ name: s.string() })),
   (c) => c.text("hello")
);

const sub2 = new Hono().route("/", sub);

describe("openapi", () => {
   test("...", async () => {
      const app = new Hono();

      app.route("/sub", sub2);
      app.get("/", openAPISpecs(app));

      /* app.get(
         "/test/:id",
         describeRoute({
            summary: "Test",
            description: "Test description",
            responses: {
               200: {
                  description: "OK",
                  content: {
                     "application/json": {
                        schema: s.object({ name: s.string() }).toJSON(),
                     },
                  },
               },
            },
            parameters: [
               {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: s.string().toJSON(),
               },
            ],
         }),
         validator("query", s.object({ name: s.string() })),
         validator("param", s.object({ id: s.string() })),
         validator("json", s.object({ name: s.string() })),
         validator(
            "cookie",
            s.partialObject({ name: s.string({ description: "Name" }) })
         ),
         async (c) => {
            return c.text("hello");
         }
      ); */

      const res = await app.request("/");
      const data = await res.json();
      /* console.log(JSON.stringify(data, null, 2));
      console.log(schemaToSpec(s.object({ name: s.string() }), "query")); */
   });
});
