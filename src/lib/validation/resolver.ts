import type { SchemaType } from "../schema";
import { getJsonPath } from "../utils/path";
import { isSchema, isString } from "../utils";

export class Resolver {
   private cache: Map<string, SchemaType>;

   constructor(readonly root: SchemaType) {
      this.cache = new Map<string, SchemaType>();
   }

   hasRef<S extends SchemaType>(
      s: S,
      value: unknown
   ): s is S & { $ref: string } {
      return value !== undefined && "$ref" in s && isString(s.$ref);
   }

   resolve(ref: string): SchemaType {
      let refSchema = this.cache.get(ref);
      if (!refSchema) {
         refSchema = getJsonPath(this.root, ref);
         if (!isSchema(refSchema)) {
            throw new Error(`ref not found: ${ref}`);
         }

         if ("$ref" in refSchema && refSchema.$ref === ref) {
            throw new Error(`ref loop: ${ref}`);
         }

         this.cache.set(ref, refSchema);
      }

      return refSchema;
   }
}
