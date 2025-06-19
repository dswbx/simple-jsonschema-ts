import { Schema, symbol, type StrictOptions } from "../schema";
import { fromSchema } from "../schema/from-schema";
import type { Merge } from "../static";
import { mergeAllOf } from "../utils/merge-allof";
import type { IUnionOptions } from "./union";

export type StaticUnionAllOf<T extends Schema[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends Schema
      ? Rest extends Schema[]
         ? Merge<U[typeof symbol]["static"] & StaticUnionAllOf<Rest>>
         : U[typeof symbol]["static"]
      : never
   : {};

export const allOf = <const T extends Schema[], const O extends IUnionOptions>(
   schemas: T,
   options?: StrictOptions<IUnionOptions, O>
): Schema<O, StaticUnionAllOf<T>, StaticUnionAllOf<T>> & O => {
   const clone = JSON.parse(
      JSON.stringify({
         ...options,
         allOf: schemas,
      })
   );

   return fromSchema(mergeAllOf(clone)) as any;
};
