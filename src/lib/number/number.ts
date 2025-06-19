import {
   Schema,
   createSchema,
   type ISchemaOptions,
   type StrictOptions,
} from "../schema/schema";
import { isString } from "../utils";

export interface INumberOptions extends ISchemaOptions {
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;
}

const base = (
   type: string,
   overrides: { parseFn: (s: string) => number },
   o?: INumberOptions
) =>
   createSchema(type, o, {
      template: () => 0,
      coerce: (value) => {
         if (isString(value)) {
            const n = overrides.parseFn(value);
            if (!Number.isNaN(n)) {
               return n;
            }
         }
         return value as number;
      },
   });

export const number = <const O extends INumberOptions>(
   config?: StrictOptions<INumberOptions, O>
): Schema<O, number> & O => base("number", { parseFn: Number }, config) as any;

export const integer = <const O extends INumberOptions>(
   config?: StrictOptions<INumberOptions, O>
): Schema<O, number> & O =>
   base("integer", { parseFn: Number.parseInt }, config) as any;
