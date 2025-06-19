import {
   Schema,
   type ISchemaOptions,
   type StrictOptions,
   createSchema,
} from "../schema";
import type { Static, StaticCoerced } from "../static";

export interface IRecordOptions extends ISchemaOptions {
   additionalProperties: never;
}

type RecordStatic<AP extends Schema> = Record<string, Static<AP>>;
type RecordCoerced<AP extends Schema> = Record<string, StaticCoerced<AP>>;

export const record = <const AP extends Schema, const O extends IRecordOptions>(
   ap: AP,
   options?: StrictOptions<IRecordOptions, O>
): Schema<O, RecordStatic<AP>, RecordCoerced<AP>> & O =>
   createSchema("object", {
      ...options,
      additionalProperties: ap,
   }) as any;
