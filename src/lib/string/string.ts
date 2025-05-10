import {
   type StaticConstEnum,
   type TSchema,
   type TSchemaWithFn,
   create,
} from "../base";
import type { StringSchema } from "../types";

export interface TString<S extends StringSchema = StringSchema>
   extends TSchema<"string">,
      StringSchema {
   static: StaticConstEnum<S, string>;
}

export const string = <const S extends TSchemaWithFn<StringSchema>>(
   schema?: S
) =>
   create<TString<S>>("string", {
      template: () => "",
      coerce: (value) => String(value),
      ...schema,
      type: "string",
   });

export const stringConst = <const S extends TSchemaWithFn<StringSchema>>(
   schema: S
) =>
   create<TString<S>>("string", {
      template: () => "",
      coerce: (value) => String(value),
      ...schema,
      type: "string",
      const: schema.const,
      default: schema.const,
      readOnly: true,
   });
