import { SchemaType, type TCustomType } from "../schema";
import { isNumber, isString } from "../utils";
import type { CoercionOptions } from "../validation/coerce";

export interface BooleanSchema extends TCustomType {}

export class BooleanType<const O extends BooleanSchema> extends SchemaType<
   O,
   boolean
> {
   protected _template = false;
   type = "boolean";

   override _coerce(value: unknown, opts?: CoercionOptions) {
      if ("coerce" in this._schema && this._schema.coerce) {
         return this._schema.coerce(value) as boolean;
      }
      if (isString(value) && ["true", "false", "1", "0"].includes(value)) {
         return value === "true" || value === "1";
      }
      if (isNumber(value)) {
         if (value === 1) return true;
         if (value === 0) return false;
      }

      return value as any;
   }
}

export const boolean = <const O extends BooleanSchema>(config?: O) =>
   new BooleanType<O>(config);
