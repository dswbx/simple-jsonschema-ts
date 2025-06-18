import {
   type TCustomType,
   type TSchemaTemplateOptions,
   SchemaType,
} from "../schema";
import type {
   Merge,
   OptionalUndefined,
   Simplify,
   Static,
   StaticCoerced,
} from "../static";
import { invariant, isSchema } from "../utils";
import type { CoercionOptions } from "../validation/coerce";

export type TProperties = { [key: string]: SchemaType };

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

export interface ObjectSchema extends TCustomType {
   $defs?: Record<string, SchemaType>;
   patternProperties?: { [key: string]: SchemaType };
   additionalProperties?: SchemaType | false;
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: SchemaType;
}

// @todo: add base object type
// @todo: add generic coerce and template that also works with additionalProperties, etc.

export class ObjectType<
   P extends TProperties = TProperties,
   const O extends ObjectSchema = ObjectSchema,
   Out = O extends { additionalProperties: false }
      ? ObjectStatic<P>
      : Simplify<Merge<ObjectStatic<P> & { [key: string]: unknown }>>,
   OutCoerced = O extends { additionalProperties: false }
      ? ObjectCoerced<P>
      : Simplify<Merge<ObjectCoerced<P> & { [key: string]: unknown }>>
> extends SchemaType<O, Out, OutCoerced> {
   protected _template = {} as any;
   readonly type = "object";
   readonly properties: P;

   constructor(properties: P, options: O = {} as O) {
      const required: string[] = [];
      for (const [key, value] of Object.entries(properties || {})) {
         invariant(
            isSchema(value),
            "properties must be managed schemas",
            value
         );
         if (!value._optional) {
            required.push(key);
         }
      }

      const additionalProperties =
         options.additionalProperties === false
            ? SchemaType.false()
            : options.additionalProperties;

      super({
         ...options,
         additionalProperties,
         properties,
         required: required.length > 0 ? required : undefined,
      });
      this.properties = properties;
   }

   strict() {
      return new ObjectType(this.properties, {
         ...this.getSchema(),
         additionalProperties: false,
      }) as unknown as ObjectType<
         P,
         Merge<O & { additionalProperties: false }>
      >;
   }

   partial() {
      const props = { ...this.properties };
      for (const [, prop] of Object.entries(props)) {
         prop._optional = true;
      }

      return new ObjectType(props, this.getSchema()) as unknown as ObjectType<
         {
            [Key in keyof P]: P[Key] extends SchemaType<
               infer O,
               infer T,
               infer C
            >
               ? SchemaType<Exclude<O, boolean>, T | undefined, C | undefined>
               : never;
         },
         O
      >;
   }

   override template(opts: TSchemaTemplateOptions = {}) {
      const result: Record<string, unknown> = {};

      if (this.properties) {
         for (const [key, property] of Object.entries(this.properties)) {
            if (
               opts.withOptional !== true &&
               !this._schema.required?.includes(key)
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
   }

   override _coerce(value: unknown, opts: CoercionOptions = {}): any {
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
         for (const [key, property] of Object.entries(this.properties)) {
            const v = value[key];
            if (v !== undefined) {
               // @ts-ignore
               value[key] = property.coerce(v, opts);
            }
         }
      }

      return value;
   }
}

export const object = <P extends TProperties, const O extends ObjectSchema>(
   properties: P,
   options: O = {} as O
) => new ObjectType(properties, options);
