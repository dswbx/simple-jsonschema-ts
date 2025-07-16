import {
   Schema,
   symbol,
   type ISchemaOptions,
   type StrictOptions,
   booleanSchema,
   Node,
   type WalkOptions,
} from "../schema/schema";
import type {
   Merge,
   OptionalUndefined,
   Simplify,
   Static,
   StaticCoerced,
   Writeable,
} from "../static";
import {
   invariant,
   isObject,
   isSchema,
   isPlainObject,
   pickKeys,
   injectCtx,
} from "../utils";
import { getPath } from "../utils/path";

export type TProperties = {
   [key: string]: Schema;
};
export type TProperties2<P extends object> = {
   [K in keyof P]: P[K] extends Schema ? P[K] : never;
};

export type ObjectStatic<T extends TProperties> = Simplify<
   OptionalUndefined<
      // this is adding the `[key: number]: unknown` signature
      Writeable<{
         [K in keyof T]: Static<T[K]>;
      }>
   >
>;

export type ObjectCoerced<T extends TProperties> = Simplify<
   OptionalUndefined<
      Writeable<{
         [K in keyof T]: StaticCoerced<T[K]>;
      }>
   >
>;

export type ObjectDefaults<T extends TProperties> = Simplify<
   OptionalUndefined<
      Writeable<{
         [K in keyof T]: T[K] extends {
            default: infer D;
         }
            ? D
            : T[K][typeof symbol]["static"];
      }>
   >
>;

export interface IObjectOptions extends ISchemaOptions {
   $defs?: Record<string, Schema>;
   patternProperties?: Record<string, Schema>;
   additionalProperties?: Schema | false;
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: Schema;
}

// @todo: add base object type
// @todo: add generic coerce and template that also works with additionalProperties, etc.

export class ObjectSchema<
   const P extends TProperties = TProperties,
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
   required: string[] | undefined;

   constructor(public readonly properties: P, o?: O, ctx?: unknown) {
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
            template: (_value, opts) => {
               let value = isObject(_value) ? _value : {};
               const result: Record<string, unknown> = { ...value };

               if (this.properties) {
                  for (const [key, property] of Object.entries(
                     this.properties
                  )) {
                     const v = getPath(value, key);

                     if (property.isOptional()) {
                        if (
                           opts?.withOptional !== true &&
                           v === undefined &&
                           _value === undefined
                        ) {
                           continue;
                        }
                     }

                     const template = property.template(v, opts);
                     if (template !== undefined) {
                        result[key] = template;
                     }
                  }
               }

               if (
                  Object.keys(result).length === 0 &&
                  !opts?.withExtendedOptional
               ) {
                  return undefined;
               }

               return result;
            },
            coerce: (_value, opts) => {
               let value = _value;

               if (isPlainObject(value) && opts?.dropUnknown === true) {
                  value = pickKeys(value, Object.keys(this.properties));
               }

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
         },
         ctx
      );
      this.required = required;
      injectCtx(this, properties);
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
            [Key in keyof P]: P[Key] extends Schema<infer O, infer T, infer C>
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

   override children(opts?: WalkOptions): Node[] {
      const nodes: Node[] = [];

      for (const [key, value] of Object.entries(this.properties)) {
         const node = new Node(value, opts);
         node.appendInstancePath([key]);
         node.appendKeywordPath(["properties", key]);
         nodes.push(node);
      }

      return nodes;
   }
}

// @todo: this is a hack to get the type inference to work
// cannot make P extends TProperties, destroys the type inference atm
export const object = <
   const P extends TProperties2<P>,
   const O extends IObjectOptions
>(
   properties: P,
   options?: StrictOptions<IObjectOptions, O>,
   ctx?: unknown
): ObjectSchema<P, O> & O => new ObjectSchema(properties, options, ctx) as any;

export const strictObject = <
   const P extends TProperties2<P>,
   const O extends IObjectOptions
>(
   properties: P,
   options?: StrictOptions<IObjectOptions, O>,
   ctx?: unknown
) => object(properties, options, ctx).strict();

export const partialObject = <
   const P extends TProperties2<P>,
   const O extends IObjectOptions
>(
   properties: P,
   options?: StrictOptions<IObjectOptions, O>,
   ctx?: unknown
) => object(properties, options, ctx).partial();
