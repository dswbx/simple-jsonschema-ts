import {
   type Static,
   type TSchema,
   type TSchemaTemplateOptions,
   type TSchemaWithFn,
   type ValidationOptions,
   type ValidationResult,
   create,
} from "../base";
import { $optional } from "../symbols";
import type { ObjectSchema } from "../types";
import { invariant, isObject, isSchema, isValidPropertyName } from "../utils";
import { error, makeOpts, valid } from "../utils/details";

export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]>;
};

export interface TObject<T extends TProperties>
   extends TSchema<"object">,
      ObjectSchema<TSchema> {
   type: "object";
   properties: T;
   static: ObjectStatic<T>;
   required?: string[] | undefined;
}

export const object = <
   P extends TProperties,
   O extends TSchemaWithFn<
      Omit<ObjectSchema<TSchema>, "properties" | "required">
   >
>(
   properties: P,
   options?: O
) => {
   for (const key of Object.keys(properties || {})) {
      invariant(isValidPropertyName(key), "invalid property name", key);
      invariant(
         isSchema(properties[key]),
         "properties must be managed schemas",
         properties[key]
      );
   }

   const required = Object.entries(properties || {})
      .filter(([, value]) => !($optional in value))
      .map(([key]) => key);

   return create<TObject<P>>("object", {
      template,
      coerce,
      ...options,
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
   });
};

export const strictObject = <
   P extends TProperties,
   O extends TSchemaWithFn<
      Omit<ObjectSchema<TSchema, TSchema, false>, "properties" | "required">
   >
>(
   properties: P,
   options?: O
) => {
   return object(properties, {
      ...options,
      additionalProperties: false,
   });
};

type PartialObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]> | undefined;
};

export interface TPartialObject<T extends TProperties>
   extends TSchema<"object">,
      ObjectSchema {
   type: "object";
   properties: T;
   static: PartialObjectStatic<T>;
}

export const partialObject = <
   P extends TProperties,
   O extends TSchemaWithFn<Omit<ObjectSchema, "properties" | "required">>
>(
   properties: P,
   options?: O
) => {
   return create<TPartialObject<P>>("object", {
      template,
      coerce,
      ...options,
      type: "object",
      properties,
   });
};

export interface TRecord<T extends TProperties>
   extends TSchema<"object">,
      ObjectSchema {
   type: "object";
   additionalProperties: TObject<T>;
   static: Record<string, Static<TObject<T>>>;
}

export const record = <
   P extends TProperties,
   O extends TSchemaWithFn<
      Omit<ObjectSchema, "required" | "additionalProperties">
   >
>(
   properties: P,
   options?: O,
   apOptions?: Omit<ObjectSchema<TSchema>, "properties" | "required">
) => {
   return create<TRecord<P>>("object", {
      template,
      coerce,
      ...options,
      type: "object",
      additionalProperties: object(properties, apOptions),
   });
};

function template(this: ObjectSchema, opts: TSchemaTemplateOptions = {}) {
   if (this.default) return this.default;
   if (this.const) return this.const;

   const result: Record<string, unknown> = {};
   const properties = {
      ...this.properties,
      ...(typeof this.additionalProperties === "object"
         ? this.additionalProperties.properties
         : {}),
   };

   if (properties) {
      for (const [key, property] of Object.entries(properties)) {
         if (opts.withOptional !== true && !this.required?.includes(key)) {
            continue;
         }

         // @ts-ignore
         const value = property.template(opts);
         if (value !== undefined) {
            result[key] = value;
         }
      }
   }
   return result;
}

function coerce(this: ObjectSchema, _value: unknown) {
   const value = typeof _value === "string" ? JSON.parse(_value) : _value;

   if (typeof value !== "object" || value === null) {
      return undefined;
   }

   const properties = {
      ...this.properties,
      ...(typeof this.additionalProperties === "object"
         ? this.additionalProperties.properties
         : {}),
   };

   if (properties) {
      for (const [key, property] of Object.entries(properties)) {
         const v = value[key];
         if (v !== undefined) {
            // @ts-ignore
            value[key] = property.coerce(v);
         }
      }
   }

   return value;
}
