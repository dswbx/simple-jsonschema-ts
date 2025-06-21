import {
   createSchema,
   Schema,
   type ISchemaOptions,
   type StrictOptions,
} from "../schema/schema";
import { isBoolean, isNumber, isString } from "../utils";

export interface IBooleanOptions extends ISchemaOptions {}

export const boolean = <const O extends IBooleanOptions>(
   config?: StrictOptions<IBooleanOptions, O>
): Schema<O, boolean> & O =>
   createSchema("boolean", config, {
      template: (value, opts) => {
         if (!opts?.withExtendedOptional) return value;
         if (value === undefined || !isBoolean(value)) return false;
         return value;
      },
      coerce: (value) => {
         if (isString(value) && ["true", "false", "1", "0"].includes(value)) {
            return value === "true" || value === "1";
         }
         if (isNumber(value)) {
            if (value === 1) return true;
            if (value === 0) return false;
         }
         return value as boolean;
      },
   }) as any;
