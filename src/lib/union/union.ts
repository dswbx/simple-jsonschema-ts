import {
   createSchema,
   Schema,
   type ISchemaOptions,
   type StrictOptions,
} from "../schema/schema";
import type { Merge, Static, StaticCoerced } from "../static";
import { matches } from "../validation/keywords";

export type StaticUnion2<T extends Schema[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends Schema
      ? Rest extends Schema[]
         ? StaticUnion<Rest> | Static<U>
         : Static<U>
      : never
   : never;

export type StaticUnion<T extends Schema[]> = {
   [K in keyof T]: T[K] extends Schema ? Static<T[K]> : never;
}[number];

/* export type StaticUnionCoerced<T extends Schema[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends Schema
      ? Rest extends Schema[]
         ? StaticUnionCoerced<Rest> | StaticCoerced<U>
         : StaticCoerced<U>
      : never
   : never; */

export type StaticUnionCoerced<T extends Schema[]> = {
   [K in keyof T]: T[K] extends Schema ? StaticCoerced<T[K]> : never;
}[number];

export type StaticUnionCoercedOptions<
   O extends ISchemaOptions,
   T extends Schema[]
> = O extends {
   coerce: (...args: any[]) => infer C;
}
   ? C
   : T extends [infer U, ...infer Rest]
   ? U extends Schema
      ? Rest extends Schema[]
         ? StaticUnionCoerced<Rest> | StaticCoerced<U>
         : StaticCoerced<U>
      : never
   : never;

export interface IUnionOptions extends ISchemaOptions {}

const union = (
   type: "oneOf" | "anyOf",
   schemas: Schema[],
   options?: IUnionOptions
) =>
   createSchema(
      undefined as any,
      {
         ...options,
         [type]: schemas,
      },
      {
         coerce: (value, opts) => {
            const customCoerce = options?.coerce;
            if (customCoerce !== undefined) {
               return customCoerce.bind(this)(value, opts);
            }

            const m = matches(schemas, value, {
               ignoreUnsupported: true,
               resolver: opts?.resolver,
               coerce: true,
            });

            if (m.length > 0) {
               return m[0]!.coerce(value, opts);
            }
            return value;
         },
      }
   );

export const anyOf = <const T extends Schema[], const O extends IUnionOptions>(
   schemas: T,
   options?: StrictOptions<IUnionOptions, O>
): Schema<O, StaticUnion<T>, StaticUnionCoercedOptions<O, T>> &
   Merge<O & { anyOf: T }> => union("anyOf", schemas, options) as any;

export const oneOf = <const T extends Schema[], const O extends IUnionOptions>(
   schemas: T,
   options?: StrictOptions<IUnionOptions, O>
): Schema<O, StaticUnion<T>, StaticUnionCoercedOptions<O, T>> & O =>
   union("oneOf", schemas, options) as any;
