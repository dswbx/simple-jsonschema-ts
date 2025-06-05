import { SchemaType, type TCustomType } from "../schema/schema";
import type { Static, StaticCoerced } from "../static";

export interface RecordSchema extends TCustomType {
   additionalProperties: never;
}

type RecordStatic<AP extends SchemaType> = Record<string, Static<AP>>;
type RecordCoerced<AP extends SchemaType> = Record<string, StaticCoerced<AP>>;

export class RecordType<
   const AP extends SchemaType,
   const O extends RecordSchema
> extends SchemaType<O, RecordStatic<AP>, RecordCoerced<AP>> {
   readonly type = "object";
   readonly additionalProperties: AP;
   protected _template = {} as any;

   constructor(additionalProperties: AP, options: O = {} as O) {
      super({
         ...options,
         additionalProperties,
      });
      this.additionalProperties = additionalProperties;
   }
}

export const record = <
   const AP extends SchemaType,
   const O extends RecordSchema
>(
   ap: AP,
   options: O = {} as O
) => new RecordType(ap, options);
