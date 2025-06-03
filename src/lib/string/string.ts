import { SchemaType, type TCustomType } from "../schema";
import { isNumber } from "../utils";
import type { CoercionOptions } from "../validation/coerce";

export interface StringSchema extends TCustomType {
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;
}

export class StringType<const O extends StringSchema> extends SchemaType<
   O,
   string
> {
   protected _template = "";
   type = "string";

   override coerce(value: unknown, opts?: CoercionOptions) {
      if (isNumber(value)) return String(value);
      return super.coerce(value, opts);
   }
}

export const string = <const O extends StringSchema>(config?: O) =>
   new StringType<O>(config);
