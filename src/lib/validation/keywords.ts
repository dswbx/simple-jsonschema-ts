import type { TSchema, ValidationOptions } from "../base";
import { InvalidTypeError } from "../errors";
import type { TAny } from "../misc/any";
import {
   isArray,
   isBoolean,
   isBooleanSchema,
   isInteger,
   isNumber,
   isObject,
   isSchema,
   isString,
   normalize,
} from "../utils";
import { error, makeOpts, valid } from "../utils/details";

export type KeywordResult = string | boolean;
type Opts = Omit<ValidationOptions, "coerce">;

/**
 * Default keywords
 */
export const _type = ({ type }: TAny, value: unknown, opts: Opts = {}) => {
   let msg: string | undefined;
   if (type === "string" && !isString(value)) msg = "Expected string";
   if (type === "number" && !isNumber(value)) msg = "Expected number";
   if (type === "integer" && !isInteger(value)) msg = "Expected integer";
   if (type === "object" && !isObject(value)) msg = "Expected object";
   if (type === "array" && !isArray(value)) msg = "Expected array";
   if (type === "boolean" && typeof value !== "boolean") {
      msg = "Expected boolean";
   }
   if (msg) return error(opts, "type", msg, value);
   return valid();
};

export const _const = (
   { const: _constValue }: TAny,
   _value: unknown,
   opts: Opts = {}
) => {
   const constValue = JSON.stringify(normalize(_constValue));
   const value = JSON.stringify(normalize(_value));
   if (constValue !== value) {
      return error(opts, "const", `Expected const: ${constValue}`, value);
   }
   return valid();
};

export const _enum = (
   { enum: _enumValues = [] }: TAny,
   _value: unknown,
   opts: Opts = {}
) => {
   const enumValues = JSON.stringify(_enumValues.map(normalize));
   const value = JSON.stringify(normalize(_value));
   if (!enumValues.includes(value)) {
      return error(opts, "enum", `Expected enum: ${enumValues}`, _value);
   }
   return valid();
};

/**
 * Strings
 */
export const pattern = (
   { pattern = "" }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isString(value)) throw new InvalidTypeError("string");
   const match = pattern.match(/^\/(.+)\/([gimuy]*)$/);
   const [, p, f] = match || [null, pattern, ""];
   if (new RegExp(p, f).test(value)) return valid();
   return error(
      opts,
      "pattern",
      `Expected string matching pattern ${pattern}`,
      value
   );
};

export const minLength = (
   { minLength = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isString(value)) throw new InvalidTypeError("string");
   const length = [...normalize(value)].length;
   if (length >= minLength) return valid();
   return error(
      opts,
      "minLength",
      `Expected string with minimum length of ${minLength}`,
      value
   );
};

export const maxLength = (
   { maxLength = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isString(value)) throw new InvalidTypeError("string");
   const length = [...normalize(value)].length;
   if (length <= maxLength) return valid();
   return error(
      opts,
      "maxLength",
      `Expected string with maximum length of ${maxLength}`,
      value
   );
};

/**
 * Numbers
 */
export const multipleOf = (
   { multipleOf = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   // Spec guard – multipleOf must be > 0 and both numbers finite
   if (
      !isNumber(value) ||
      !(Number.isFinite(value) && Number.isFinite(multipleOf)) ||
      multipleOf <= 0
   ) {
      throw new InvalidTypeError("number");
   }

   // Division first, then check "integer-ness" with a relative epsilon.
   // Machine-epsilon scaled to the magnitude of the quotient
   const quotient = value / multipleOf;
   const EPS = Number.EPSILON * Math.max(1, Math.abs(quotient));

   // Valid when quotient is within EPS of the nearest integer
   if (Math.abs(quotient - Math.round(quotient)) <= EPS) return valid();

   return error(
      opts,
      "multipleOf",
      `Expected number being a multiple of ${multipleOf}`,
      value
   );
};

export const maximum = (
   { maximum = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isNumber(value)) throw new InvalidTypeError("number");
   if (value <= maximum) return valid();
   return error(
      opts,
      "maximum",
      `Expected number less than or equal to ${maximum}`,
      value
   );
};

export const exclusiveMaximum = (
   { exclusiveMaximum = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isNumber(value)) throw new InvalidTypeError("number");
   if (value < exclusiveMaximum) return valid();
   return error(
      opts,
      "exclusiveMaximum",
      `Expected number less than ${exclusiveMaximum}`,
      value
   );
};

export const minimum = (
   { minimum = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isNumber(value)) throw new InvalidTypeError("number");
   if (value >= minimum) return valid();
   return error(
      opts,
      "minimum",
      `Expected number greater than or equal to ${minimum}`,
      value
   );
};

export const exclusiveMinimum = (
   { exclusiveMinimum = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isNumber(value)) throw new InvalidTypeError("number");
   if (value > exclusiveMinimum) return valid();
   return error(
      opts,
      "exclusiveMinimum",
      `Expected number greater than ${exclusiveMinimum}`,
      value
   );
};

/**
 * Objects
 */
export const properties = (
   { properties = {} }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isObject(value)) throw new InvalidTypeError("object");
   for (const [key, keyValue] of Object.entries(value)) {
      const schema = properties[key];
      // missing schema will be validated by additionalProperties
      if (!schema) continue;
      const result = schema.validate(
         keyValue,
         makeOpts(opts, ["properties", key], key)
      );
      if (!result.valid) return result;
   }
   return valid();
};

export const additionalProperties = (
   { properties = {}, additionalProperties, patternProperties }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isObject(value)) throw new InvalidTypeError("object");
   if (!isBoolean(additionalProperties) && !isSchema(additionalProperties)) {
      throw new InvalidTypeError(
         "additionalProperties must be a boolean or a managed schema"
      );
   }
   const props = Object.keys(properties);
   const pattern = isObject(patternProperties)
      ? Object.keys(value).filter((key) =>
           Object.keys(patternProperties).some((pattern) =>
              new RegExp(pattern).test(key)
           )
        )
      : [];
   const extra = Object.keys(value).filter(
      (key) => !props.includes(key) && !pattern.includes(key)
   );
   if (extra.length > 0) {
      if (isBooleanSchema(additionalProperties)) {
         const result = additionalProperties.validate(undefined);
         if (result) return result;
      } else if (isSchema(additionalProperties)) {
         for (const key of extra) {
            const result = additionalProperties.validate(
               value[key],
               makeOpts(opts, ["additionalProperties"], key)
            );
            if (!result.valid) return result;
         }
      }
   }
   return valid();
};

export const required = (
   { required = [] }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isObject(value)) throw new InvalidTypeError("object");
   const keys = Object.keys(value).filter(
      (key) => typeof value[key] !== "function"
   );
   if (required.every((key) => keys.includes(key))) return valid();
   return error(
      opts,
      "required",
      `Expected object with required properties ${required.join(", ")}`,
      value
   );
};

export const minProperties = (
   { minProperties = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isObject(value)) throw new InvalidTypeError("object");
   if (Object.keys(value).length >= minProperties) return valid();
   return error(
      opts,
      "minProperties",
      `Expected object with at least ${minProperties} properties`,
      value
   );
};

export const maxProperties = (
   { maxProperties = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isObject(value)) throw new InvalidTypeError("object");
   if (Object.keys(value).length <= maxProperties) return valid();
   return error(
      opts,
      "maxProperties",
      `Expected object with at most ${maxProperties} properties`,
      value
   );
};

export const patternProperties = (
   { patternProperties = {} }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isObject(value) || !isObject(patternProperties)) {
      throw new InvalidTypeError("object");
   }

   for (const [_key, _value] of Object.entries(value)) {
      for (const [pattern, schema] of Object.entries(patternProperties)) {
         if (new RegExp(pattern).test(_key)) {
            const result = schema.validate(
               _value,
               makeOpts(opts, ["patternProperties"], _key)
            );
            if (!result.valid) return result;
         }
      }
   }
   return valid();
};

export const propertyNames = (
   { propertyNames }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isObject(value)) throw new InvalidTypeError("object");
   if (propertyNames === undefined) return valid();
   if (!isSchema(propertyNames)) {
      throw new InvalidTypeError("propertyNames must be a managed schema");
   }
   for (const key of Object.keys(value)) {
      const result = propertyNames.validate(
         key,
         makeOpts(opts, ["propertyNames"], key)
      );
      if (!result.valid) return result;
   }
   return valid();
};

/**
 * Arrays
 */
export const items = (
   { items, prefixItems = [] }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isArray(value)) throw new InvalidTypeError("array");
   if (items === undefined) return valid();
   if (items === false && value.length > prefixItems.length) {
      return error(opts, "items", "Additional items are not allowed", value);
   }
   if (!isSchema(items)) {
      throw new InvalidTypeError("items must be a managed schema");
   }
   // skip prefix items
   for (const [index, item] of value.slice(prefixItems.length).entries()) {
      const result = items.validate(
         item,
         makeOpts(opts, ["items"], String(index))
      );
      if (!result.valid) return result;
   }
   return valid();
};

export const minItems = (
   { minItems = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isArray(value)) throw new InvalidTypeError("array");
   if (value.length >= minItems) return valid();
   return error(
      opts,
      "minItems",
      `Expected array with at least ${minItems} items`,
      value
   );
};

export const maxItems = (
   { maxItems = 0 }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isArray(value)) throw new InvalidTypeError("array");
   if (value.length <= maxItems) return valid();
   return error(
      opts,
      "maxItems",
      `Expected array with at most ${maxItems} items`,
      value
   );
};

export const uniqueItems = (
   { uniqueItems = false }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isArray(value)) throw new InvalidTypeError("array");
   if (uniqueItems) {
      const normalizedValues = value.map(normalize);
      if (
         new Set(normalizedValues.map((v) => JSON.stringify(v))).size ===
         value.length
      ) {
         return valid();
      }
      return error(
         opts,
         "uniqueItems",
         "Expected array with unique items",
         value
      );
   }
   return valid();
};

export const contains = (
   { contains, minContains, maxContains }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isSchema(contains)) {
      throw new Error("contains must be a managed schema");
   }
   if (!isArray(value)) throw new InvalidTypeError("array");
   const occ = value.filter((item) => contains.validate(item).valid).length;
   if (occ < (minContains ?? 1)) {
      return error(
         opts,
         minContains ? "minContains" : "contains",
         `Expected array to contain at least ${
            minContains ?? 1
         }, but found ${occ}`,
         value
      );
   }
   if (maxContains !== undefined && occ > maxContains) {
      return error(
         opts,
         "maxContains",
         `Expected array to contain at most ${maxContains}, but found ${occ}`,
         value
      );
   }
   return valid();
};

export const prefixItems = (
   { prefixItems = [] }: TAny,
   value: unknown,
   opts: Opts = {}
) => {
   if (!isArray(value)) throw new InvalidTypeError("array");
   for (let i = 0; i < value.length; i++) {
      const result = prefixItems[i]?.validate(
         value[i],
         makeOpts(opts, String(i), String(i))
      );
      if (result && result?.valid !== true) {
         return result;
      }
   }
   return valid();
};
