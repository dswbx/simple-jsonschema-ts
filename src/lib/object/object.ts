import {
   Schema,
   symbol,
   type ISchemaOptions,
   type StrictOptions,
   booleanSchema,
} from "../schema/schema";
import type {
   Merge,
   OptionalUndefined,
   Simplify,
   Static,
   StaticCoerced,
} from "../static";
import { invariant, isSchema } from "../utils";

export type TProperties = { [key: string]: Schema };

type ObjectStatic<T extends TProperties> = Simplify<
   OptionalUndefined<{
      [K in keyof T]: Static<T[K]>;
   }>
>;
type ObjectCoerced<T extends TProperties> = Simplify<
   OptionalUndefined<{
      [K in keyof T]: StaticCoerced<T[K]>;
   }>
>;

export interface IObjectOptions extends ISchemaOptions {
   $defs?: Record<string, Schema>;
   patternProperties?: { [key: string]: Schema };
   additionalProperties?: Schema | false;
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: Schema;
}

// @todo: add base object type
// @todo: add generic coerce and template that also works with additionalProperties, etc.

export class ObjectSchema<
   P extends TProperties = TProperties,
   const O extends IObjectOptions = IObjectOptions
> extends Schema<
   O,
   O extends { additionalProperties: false }
      ? ObjectStatic<P>
      : Simplify<Merge<ObjectStatic<P> & { [key: string]: unknown }>>,
   O extends { additionalProperties: false }
      ? ObjectCoerced<P>
      : Simplify<Merge<ObjectCoerced<P> & { [key: string]: unknown }>>
> {
   override readonly type = "object";
   properties: P;
   required: string[] | undefined;

   constructor(properties: P, o?: O) {
      let required: string[] | undefined = [];
      for (const [key, value] of Object.entries(properties || {})) {
         invariant(
            isSchema(value),
            "properties must be managed schemas",
            value
         );
         if (!value[symbol].optional) {
            required.push(key);
         }
      }

      const additionalProperties =
         o?.additionalProperties === false
            ? booleanSchema(false)
            : o?.additionalProperties;

      required = required.length > 0 ? required : undefined;
      super(
         {
            ...o,
            additionalProperties,
            properties,
            required,
         } as any,
         {
            template: (opts) => {
               const result: Record<string, unknown> = {};

               if (this.properties) {
                  for (const [key, property] of Object.entries(
                     this.properties
                  )) {
                     if (
                        opts?.withOptional !== true &&
                        !this.required?.includes(key)
                     ) {
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
            },
            coerce: (value, opts) => {
               if (typeof value === "string") {
                  // if stringified object
                  if (value.match(/^\{/)) {
                     value = JSON.parse(value);
                  }
               }

               if (typeof value !== "object" || value === null) {
                  return undefined;
               }

               if (this.properties) {
                  for (const [key, property] of Object.entries(
                     this.properties
                  )) {
                     const v = value[key];
                     if (v !== undefined) {
                        // @ts-ignore
                        value[key] = property.coerce(v, opts);
                     }
                  }
               }

               return value;
            },
         }
      );
      this.properties = properties;
      this.required = required;
   }

   strict() {
      return new ObjectSchema(this.properties, {
         ...this[symbol].raw,
         additionalProperties: false,
      }) as unknown as ObjectSchema<
         P,
         Merge<O & { additionalProperties: false }>
      >;
   }

   partial() {
      const props = { ...this.properties };
      for (const [, prop] of Object.entries(props)) {
         prop[symbol].optional = true;
      }

      return new ObjectSchema(
         props,
         this[symbol].raw
      ) as unknown as ObjectSchema<
         {
            [Key in keyof P]: P[Key] extends Schema<infer O>
               ? Schema<
                    O,
                    P[Key][typeof symbol]["static"] | undefined,
                    P[Key][typeof symbol]["coerced"] | undefined
                 >
               : never;
         },
         O
      >;
   }
}

export const object = <P extends TProperties, const O extends IObjectOptions>(
   properties: P,
   options?: StrictOptions<IObjectOptions, O>
): ObjectSchema<P, O> & O => new ObjectSchema(properties, options) as any;
