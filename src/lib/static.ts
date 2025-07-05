import type { Schema, IAnySchema, symbol } from "./schema";

// from https://github.com/type-challenges/type-challenges/issues/28200
export type Merge<T> = {
   [K in keyof T]: T[K];
};
export type OptionalUndefined<
   T,
   Props extends keyof T = keyof T,
   OptionsProps extends keyof T = Props extends keyof T
      ? undefined extends T[Props]
         ? Props
         : never
      : never
> = Merge<
   {
      [K in OptionsProps]?: T[K];
   } & {
      [K in Exclude<keyof T, OptionsProps>]: T[K];
   }
>;
// https://github.com/sindresorhus/type-fest/blob/main/source/simplify.d.ts
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type OptionallyOptional<T, C> = T extends undefined ? C | undefined : C;
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type DeepWriteable<T> = {
   -readonly [P in keyof T]: DeepWriteable<T[P]>;
};

export type Static<S extends Schema | IAnySchema> =
   S[typeof symbol]["static"] extends {
      [key: string]: any;
   }
      ? Simplify<S[typeof symbol]["static"]>
      : S[typeof symbol]["static"];

export type StaticCoerced<S extends Schema | IAnySchema> =
   S[typeof symbol]["coerced"] extends {
      [key: string]: any;
   }
      ? Simplify<S[typeof symbol]["coerced"]>
      : S[typeof symbol]["coerced"];

export type StaticConstEnum<Schema, Fallback = unknown> = Schema extends {
   const: infer C;
}
   ? C
   : Schema extends { enum: infer E }
   ? E extends readonly any[]
      ? [...E][number]
      : E extends any[]
      ? E[number]
      : Fallback
   : Fallback;
