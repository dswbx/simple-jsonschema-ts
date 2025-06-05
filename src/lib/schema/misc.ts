import { SchemaType, type TCustomType } from "./schema";

export class AnyType<const O extends TCustomType> extends SchemaType<
   O,
   any,
   any
> {}
export const any = <const O extends TCustomType>(options: O = {} as O) =>
   new AnyType(options);

type Primitive = string | number | boolean | null | undefined | bigint;

type TLiteralType<T, Excluded extends object> = T extends Primitive
   ? T
   : T extends object
   ? T extends Excluded
      ? never
      : T
   : never;

export class LiteralType<
   const L,
   const O extends Omit<TCustomType, "const">
> extends SchemaType<O, L, L> {}

export const literal = <const L, const O extends Omit<TCustomType, "const">>(
   value: TLiteralType<L, SchemaType>,
   options: O = {} as O
) =>
   new LiteralType<L, O>({
      ...options,
      const: value,
   });
