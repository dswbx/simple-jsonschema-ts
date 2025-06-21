import { Schema, type ISchemaOptions, type StrictOptions } from "../schema";
import type { Simplify, Static, StaticCoerced } from "../static";
import { isObject } from "../utils";

type RecordStatic<AP extends Schema> = Simplify<Record<string, Static<AP>>>;
type RecordCoerced<AP extends Schema> = Simplify<
   Record<string, StaticCoerced<AP>>
>;

export interface IRecordOptions extends ISchemaOptions {
   additionalProperties?: never;
}

export class RecordSchema<
   AP extends Schema,
   O extends IRecordOptions = IRecordOptions
> extends Schema<O, RecordStatic<AP>, RecordCoerced<AP>> {
   additionalProperties: AP;

   constructor(ap: AP, o?: O) {
      super(
         {
            ...o,
            additionalProperties: ap,
         } as any,
         {
            template: (value, opts) => {
               if (!opts?.withExtendedOptional) return value;
               if (value === undefined || !isObject(value)) return {};
               return value;
            },
         }
      );
      this.additionalProperties = ap;
   }
}

export const record = <const AP extends Schema, const O extends IRecordOptions>(
   ap: AP,
   options?: StrictOptions<IRecordOptions, O>
): RecordSchema<AP, O> => new RecordSchema(ap, options) as any;
