import type { TSchema } from "../base";
import { InvariantError } from "../errors";
import { $kind } from "../symbols";
import type {
   BaseJSONSchema,
   PropertyName,
   JSONSchemaDefinition,
} from "../types";

export function isDefined(value: unknown): value is NonNullable<unknown> {
   return typeof value !== "undefined";
}

export function isObject(value: unknown): value is Record<string, unknown> {
   return !Array.isArray(value) && typeof value === "object" && value !== null;
}

export function isString(value: unknown): value is string {
   return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
   return typeof value === "number";
}

export function isInteger(value: unknown): value is number {
   return typeof value === "number" && Number.isInteger(value);
}

export function isBoolean(value: unknown): value is boolean {
   return typeof value === "boolean";
}

export function isArray(value: unknown): value is unknown[] {
   return Array.isArray(value);
}

export function isValidPropertyName(value: unknown): value is PropertyName {
   return typeof value === "string" && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

export function isNonBooleanRawSchema(
   schema: unknown
): schema is Exclude<JSONSchemaDefinition, boolean> {
   return typeof schema !== "boolean";
}

export function isTypeSchema(schema: unknown): schema is BaseJSONSchema {
   return (
      schema !== undefined && isNonBooleanRawSchema(schema) && "type" in schema
   );
}

export function isSchema(schema: unknown): schema is TSchema {
   return isObject(schema) && $kind in schema;
}

export function isBooleanSchema(schema: unknown): schema is TSchema {
   return isSchema(schema) && schema[$kind] === "booleanSchema";
}

export function matchesPattern(pattern: string, value: string): boolean {
   const match = pattern.match(/^\/(.+)\/([gimuy]*)$/);
   const [, p, f] = match || [null, pattern, ""];
   return new RegExp(p, f).test(value);
}

export function invariant(
   condition: boolean,
   message: string,
   value: unknown
): asserts condition {
   if (!condition) {
      throw new InvariantError(message, value);
   }
}

export function normalize(value: unknown) {
   if (isArray(value)) {
      return value.map(normalize).sort();
   }
   if (isObject(value)) {
      const sortedEntries = Object.entries(value)
         .sort(([a], [b]) => a.localeCompare(b))
         .map(([k, v]) => [k, normalize(v)]);
      return Object.fromEntries(sortedEntries);
   }
   if (isString(value)) {
      return value.normalize("NFC");
   }
   return value;
}
