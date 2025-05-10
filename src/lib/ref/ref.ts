import { create, type Static, type TSchema } from "../base";

export interface Ref<T extends TSchema> extends TSchema {
   $ref: string;
   static: Static<T>;
}

export const ref = <T extends TSchema>(
   schema: T,
   prefix: "$defs" | "definitions" = "$defs"
) => {
   if (!schema.$id) {
      throw new Error("Schema must have a $id");
   }

   return create<Ref<T>>("ref", {
      $ref: `#/${prefix}/${schema.$id}`,
   });
};
