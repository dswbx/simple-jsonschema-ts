import {
   Node,
   Schema,
   type ISchemaOptions,
   type StrictOptions,
   type WalkOptions,
} from "../schema/schema";
import type { Merge, Static, StaticCoerced } from "../static";
import { matches } from "../validation/keywords";
import { injectCtx } from "../utils";

export type StaticUnion2<T extends Schema[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends Schema
      ? Rest extends Schema[]
         ? StaticUnion<Rest> | Static<U>
         : Static<U>
      : never
   : never;

export type StaticUnion<T extends Schema[]> = {
   [K in keyof T]: T[K] extends Schema ? Static<T[K]> : never;
}[number];

export type StaticUnionCoerced<T extends Schema[]> = {
   [K in keyof T]: T[K] extends Schema ? StaticCoerced<T[K]> : never;
}[number];

export type StaticUnionCoercedOptions<
   O extends ISchemaOptions,
   T extends Schema[]
> = O extends {
   coerce: (...args: any[]) => infer C;
}
   ? C
   : T extends [infer U, ...infer Rest]
   ? U extends Schema
      ? Rest extends Schema[]
         ? StaticUnionCoerced<Rest> | StaticCoerced<U>
         : StaticCoerced<U>
      : never
   : never;

export interface IUnionOptions extends ISchemaOptions {}

const unionTypeSymbol = Symbol.for("unionType");

export class UnionSchema<T extends Schema[]> extends Schema<
   IUnionOptions,
   StaticUnion<T>,
   StaticUnionCoercedOptions<IUnionOptions, T>
> {
   [unionTypeSymbol]: "oneOf" | "anyOf";

   constructor(
      schemas: T,
      type: "oneOf" | "anyOf",
      options?: IUnionOptions,
      ctx?: unknown
   ) {
      super(
         {
            ...options,
            [type]: schemas,
         },
         {
            coerce: (value, opts) => {
               const customCoerce = options?.coerce;
               if (customCoerce !== undefined) {
                  return customCoerce.bind(this)(value, opts);
               }

               const m = matches(schemas, value, {
                  ignoreUnsupported: true,
                  resolver: opts?.resolver,
                  coerce: true,
               });

               if (m.length > 0) {
                  return m[0]!.coerce(value, opts);
               }
               return value;
            },
         },
         ctx
      );
      this[unionTypeSymbol] = type;
      injectCtx(this, schemas);
   }

   get schemas() {
      return this[this[unionTypeSymbol]];
   }

   override children(opts?: WalkOptions): Node[] {
      const nodes: Node[] = [];
      for (const [i, schema] of this.schemas.entries()) {
         const node = new Node(schema, opts);
         node.appendKeywordPath([this[unionTypeSymbol], i]);
         nodes.push(node);
      }
      return nodes;
   }
}

export const anyOf = <const T extends Schema[], const O extends IUnionOptions>(
   schemas: T,
   options?: StrictOptions<IUnionOptions, O>,
   ctx?: unknown
): Schema<O, StaticUnion<T>, StaticUnionCoercedOptions<O, T>> &
   Merge<O & { anyOf: T }> =>
   new UnionSchema(schemas, "anyOf", options, ctx) as any;

export const oneOf = <const T extends Schema[], const O extends IUnionOptions>(
   schemas: T,
   options?: StrictOptions<IUnionOptions, O>,
   ctx?: unknown
): Schema<O, StaticUnion<T>, StaticUnionCoercedOptions<O, T>> & O =>
   new UnionSchema(schemas, "oneOf", options, ctx) as any;
