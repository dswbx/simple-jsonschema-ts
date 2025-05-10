import type { TSchema, ValidationOptions, ValidationResult } from "../base";
import { error, valid } from "../utils/details";
import {
   _type,
   _const,
   _enum,
   maxLength,
   minLength,
   pattern,
   multipleOf,
   maximum,
   minimum,
   exclusiveMaximum,
   exclusiveMinimum,
   required,
   minProperties,
   maxProperties,
   minItems,
   maxItems,
   uniqueItems,
   contains,
   prefixItems,
   items,
   additionalProperties,
   patternProperties,
   properties,
   propertyNames,
} from "./keywords";
import { InvalidTypeError } from "../errors";
import type { TAny } from "../misc/any";
import { format } from "./format";

const defaultKeywords = {
   type: _type,
   const: _const,
   enum: _enum,
} as const;

export const keywords: Record<
   string,
   Record<
      string,
      (
         schema: TAny,
         value: unknown,
         opts: Omit<ValidationOptions, "coerce">
      ) => ValidationResult
   >
> = {
   string: {
      ...defaultKeywords,
      pattern,
      minLength,
      maxLength,
      //format,
   },
   number: {
      ...defaultKeywords,
      multipleOf,
      maximum,
      exclusiveMaximum,
      minimum,
      exclusiveMinimum,
   },
   integer: {
      ...defaultKeywords,
      multipleOf,
      maximum,
      exclusiveMaximum,
      minimum,
      exclusiveMinimum,
   },
   boolean: {
      ...defaultKeywords,
   },
   object: {
      ...defaultKeywords,
      required,
      minProperties,
      maxProperties,
      propertyNames,
      properties,
      patternProperties,
      additionalProperties,
   },
   array: {
      ...defaultKeywords,
      minItems,
      maxItems,
      uniqueItems,
      contains,
      prefixItems,
      items,
   },
};

export const allKeywords = {
   ...defaultKeywords,
   ...Object.fromEntries(
      Object.values(keywords).flatMap((k) => Object.entries(k))
   ),
};

export function getTypeKeywords(schema: TSchema) {
   const type = schema.type;
   if (!type || type === undefined) return undefined;
   const types = Array.isArray(type) ? type : [type];
   return Object.fromEntries(
      Object.entries(keywords)
         .filter(([k]) => types.includes(k as any))
         .flatMap(([, v]) => Object.entries(v))
   );
}

export function validateTypeKeywords(
   schema: TSchema,
   value: unknown,
   opts: Omit<ValidationOptions, "coerce"> = {}
): ValidationResult {
   const typeKeywords = getTypeKeywords(schema);
   const fallback = typeKeywords === undefined;
   const keywords = fallback ? allKeywords : typeKeywords;

   for (const [keyword, validator] of Object.entries(keywords)) {
      if (schema[keyword] === undefined) continue;
      try {
         const result = validator(schema, value, opts);
         if (!result.valid) return result;
      } catch (e) {
         if (e instanceof InvalidTypeError) {
            if (!fallback) {
               return error(opts, keyword, e.message, value);
            }
         }
      }
   }
   return valid();
}
