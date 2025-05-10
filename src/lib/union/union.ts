import {
   type TSchema,
   type Merge,
   create,
   type TSchemaWithFn,
   type ValidationOptions,
} from "../base";
import type { BaseJSONSchema } from "../types";
import { error, valid } from "../utils/details";

type StaticUnion<T extends TSchema[]> = T extends [infer U, ...infer Rest]
   ? U extends TSchema
      ? Rest extends TSchema[]
         ? StaticUnion<Rest> | U["static"]
         : U["static"]
      : never
   : never;

export interface TUnion<T extends TSchema[], Kind extends "anyOf" | "oneOf">
   extends TSchema<Kind> {
   static: StaticUnion<T>;
   matches: (value: unknown) => TSchema[];
}

export interface TUnionAnyOf<T extends TSchema[]> extends TUnion<T, "anyOf"> {
   anyOf: T;
}

type UnionSchema = BaseJSONSchema;

export const anyOf = <
   const T extends TSchema[],
   S extends TSchemaWithFn<UnionSchema>
>(
   schemas: T,
   schema?: S
) => {
   return create<TUnionAnyOf<T>>("anyOf", {
      validate: function (
         this: TUnionAnyOf<T>,
         value: unknown,
         opts: ValidationOptions = {}
      ) {
         const matches = this.matches(value);
         if (matches.length > 0) {
            return valid();
         }
         return error(opts, "anyOf", "Expected at least one to match");
      },
      ...schema,
      anyOf: schemas,
      matches,
   } as any);
};

export interface TUnionOneOf<T extends TSchema[]> extends TUnion<T, "oneOf"> {
   oneOf: T;
}

export const oneOf = <
   const T extends TSchema[],
   S extends TSchemaWithFn<UnionSchema>
>(
   schemas: T,
   schema?: S
) => {
   return create<TUnionOneOf<T>>("oneOf", {
      validate: function (
         this: TUnionAnyOf<T>,
         value: unknown,
         opts: ValidationOptions = {}
      ) {
         const matches = this.matches(value);
         if (matches.length === 0) {
            return error(opts, "oneOf", "Expected exactly one to match");
         } else if (matches.length > 1) {
            return error(
               opts,
               "oneOf",
               "Expected exactly one to match, but got " + matches.length
            );
         }
         return valid();
      },
      ...schema,
      oneOf: schemas,
      matches,
   } as any);
};

function matches<T extends TSchema[]>(
   this: TUnionAnyOf<T> | TUnionOneOf<T>,
   value: unknown
): TSchema[] {
   const schemas = "anyOf" in this ? this.anyOf : this.oneOf;
   return schemas
      .map((s) => (s.validate(value).valid ? s : undefined))
      .filter(Boolean) as TSchema[];
}

type StaticUnionAllOf<T extends TSchema[]> = T extends [infer U, ...infer Rest]
   ? U extends TSchema
      ? Rest extends TSchema[]
         ? Merge<U["static"] & StaticUnionAllOf<Rest>>
         : U["static"]
      : never
   : {};

export interface TUnionAllOf<T extends TSchema[]> extends TSchema<"union"> {
   static: StaticUnionAllOf<T>;
}

// use with caution!
export const allOf = <
   const T extends TSchema[],
   S extends TSchemaWithFn<UnionSchema>
>(
   schemas: T,
   schema?: S
): TUnionAllOf<T> => {
   return create<TUnionAllOf<T>>("allOf", {
      validate: function (this: TUnionAllOf<T>, value: unknown) {
         throw new Error("allOf validation not implemented");
      },
      ...schema,
      allOf: schemas,
   } as any);
};
