import { SchemaType } from "../schema";
import { fromSchema } from "../schema/from-schema";
import type { Merge } from "../static";
import { mergeAllOf } from "../utils/merge-allof";
import type { UnionSchema } from "./union";

export type StaticUnionAllOf<T extends SchemaType[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends SchemaType
      ? Rest extends SchemaType[]
         ? Merge<U["static"] & StaticUnionAllOf<Rest>>
         : U["static"]
      : never
   : {};

export const allOf = <
   const T extends SchemaType[],
   const O extends UnionSchema
>(
   schemas: T,
   options: O = {} as O
): SchemaType<O, StaticUnionAllOf<T>> => {
   const clone = JSON.parse(
      JSON.stringify({
         ...options,
         allOf: schemas,
      })
   );

   return fromSchema(mergeAllOf(clone)) as any;
};
