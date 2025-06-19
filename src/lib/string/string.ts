import {
   createSchema,
   Schema,
   type ISchemaOptions,
   type StrictOptions,
} from "../schema/schema";
import { isNumber } from "../utils";

export interface IStringOptions extends ISchemaOptions {
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;
}

export const string = <const O extends IStringOptions>(
   o?: StrictOptions<IStringOptions, O>
): Schema<O, string> & O =>
   createSchema("string", o, {
      template: () => "",
      coerce: (value) => {
         if (isNumber(value)) return String(value);
         return value as string;
      },
   }) as any;
