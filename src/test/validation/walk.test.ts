import { describe, test, expect } from "bun:test";
import * as s from "../../lib";

describe("walk", () => {
   class SecretSchema extends s.StringSchema {}
   const secret = () => new SecretSchema();

   test("...", () => {
      const schema = s.object({
         name: s.string(),
         age: s.number(),
         address: s.object({
            street: secret(),
            city: s.string(),
            current: s.boolean(),
         }),
      });

      //console.log("schema", schema.toJSON());

      const data = {
         name: "John Doe",
         age: 30,
         address: {
            street: "123 Main St",
            city: "Anytown",
            current: true,
         },
      };
      /* console.log(
         [...schema.walk({ data })].map((n) => ({
            ...n,
            schema: n.schema.constructor.name,
         }))
      ); */
   });
});
