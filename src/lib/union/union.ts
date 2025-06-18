import { type TCustomType, SchemaType } from "../schema";
import type { Static, StaticCoerced } from "../static";
import type { CoercionOptions } from "../validation/coerce";
import { matches } from "../validation/keywords";

export type StaticUnion<T extends SchemaType[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends SchemaType
      ? Rest extends SchemaType[]
         ? StaticUnion<Rest> | Static<U>
         : Static<U>
      : never
   : never;

export type StaticUnionCoerced<T extends SchemaType[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends SchemaType
      ? Rest extends SchemaType[]
         ? StaticUnionCoerced<Rest> | StaticCoerced<U>
         : StaticCoerced<U>
      : never
   : never;

export interface UnionSchema extends TCustomType {}

export abstract class UnionType<
   const T extends SchemaType[],
   const O extends UnionSchema
> extends SchemaType<O, StaticUnion<T>, StaticUnionCoerced<T>> {
   readonly schemas: T;

   constructor(type: "oneOf" | "anyOf", schemas: T, options: O = {} as O) {
      super({
         ...options,
         [type]: schemas,
      });
      this.schemas = schemas;
   }

   override _coerce(value: unknown, opts: CoercionOptions = {}): any {
      if ("coerce" in this._schema && this._schema.coerce !== undefined) {
         return this._schema.coerce.bind(this)(value, opts);
      }

      const m = matches(this.schemas, value, {
         ignoreUnsupported: true,
         resolver: opts.resolver,
         coerce: true,
      });
      //console.log("m", { schemas: this.schemas, value, opts, m });

      if (m.length > 0) {
         return m[0]!.coerce(value, opts);
      }
      return value;
   }
}

export interface AnyOfSchema extends TCustomType {}

export class AnyOfType<
   const T extends SchemaType[],
   const O extends AnyOfSchema
> extends UnionType<T, O> {
   constructor(schemas: T, options: O = {} as O) {
      super("anyOf", schemas, options);
   }
}

export const anyOf = <
   const T extends SchemaType[],
   const O extends AnyOfSchema
>(
   schemas: T,
   options: O = {} as O
) => new AnyOfType(schemas, options);

export interface OneOfSchema extends TCustomType {}

export class OneOfType<
   const T extends SchemaType[],
   const O extends OneOfSchema
> extends UnionType<T, O> {
   constructor(schemas: T, options: O = {} as O) {
      super("oneOf", schemas, options);
   }
}

export const oneOf = <
   const T extends SchemaType[],
   const O extends OneOfSchema
>(
   schemas: T,
   options: O = {} as O
) => new OneOfType(schemas, options);
