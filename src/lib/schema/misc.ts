import {
   createSchema,
   Schema,
   type ISchemaOptions,
   type StrictOptions,
} from "./schema";
import type { Merge } from "../static";

export interface IAnyOptions extends ISchemaOptions {
   [key: string]: any;
}

export const any = <const O extends IAnyOptions>(
   o?: O
): Schema<O, any, any> & O => createSchema(o?.type, o) as any;

type Primitive = string | number | boolean | null | undefined | bigint;

type TLiteralType<T, Excluded extends object> = T extends Primitive
   ? T
   : T extends object
   ? T extends Excluded
      ? never
      : T
   : never;

export interface ILiteralOptions
   extends Omit<ISchemaOptions, "const" | "enum"> {}

export const literal = <const L, const O extends ILiteralOptions>(
   value: TLiteralType<L, Schema>,
   o?: StrictOptions<ILiteralOptions, O>
): Schema<Merge<O & { const: L }>, L, L> & O =>
   createSchema(undefined as any, {
      ...o,
      const: value,
   }) as any;
