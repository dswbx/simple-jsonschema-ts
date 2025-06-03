import { SchemaType, type TCustomSchema, type TCustomType } from "../schema";
import { isString } from "../utils";
import type { CoercionOptions } from "../validation/coerce";

export interface NumberSchema extends TCustomType {
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;
}

export class NumberType<const O extends NumberSchema> extends SchemaType<
   O,
   number
> {
   protected _template = 0;
   type = "number";

   override coerce(value: unknown, opts?: CoercionOptions) {
      if (isString(value)) return Number(value);
      return super.coerce(value, opts);
   }
}

export const number = <const O extends NumberSchema>(config?: O) =>
   new NumberType<O>(config);

export class IntegerType<const O extends NumberSchema> extends NumberType<O> {
   protected _template = 0;
   type = "integer";

   override coerce(value: unknown, opts?: CoercionOptions) {
      if (isString(value)) return Number.parseInt(value);
      return super.coerce(value, opts);
   }
}

export const integer = <const O extends NumberSchema>(config?: O) =>
   new IntegerType<O>(config);
