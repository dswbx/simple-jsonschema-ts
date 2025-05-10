import type { TSchema, ValidationOptions } from "../base";
import { create } from "../base";
import { $kind, $optional } from "../symbols";
import type { JSONSchema } from "../types";
import { error, valid } from "../utils/details";

export interface TNull extends JSONSchema<TSchema>, TSchema {
   static: null;
}

export const nullSchema = () => {
   return create<TNull>("null", {
      type: "null",
      [$kind]: "nullSchema",
      validate: (v: unknown, opts: ValidationOptions = {}) => {
         if (v === null) {
            return valid();
         }
         return error(opts, "", "Expected null, got " + typeof v, v);
      },
   });
};

export const booleanSchema = (
   bool: boolean,
   schema: Exclude<JSONSchema, boolean> = {}
) => {
   return {
      ...schema,
      [$kind]: "booleanSchema",
      optional: function (this: TSchema) {
         return booleanSchema(bool, { ...this, [$optional]: true });
      },
      validate: (v: unknown, opts: ValidationOptions = {}) => {
         if (bool) {
            return valid();
         }
         return error(opts, "", "Always fails", v);
      },
      toJSON: () => bool,
   };
};
