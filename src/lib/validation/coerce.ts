import { Resolver } from "./resolver";
import type { TSchema } from "../schema";

export type CoercionOptions = {
   resolver?: Resolver;
   depth?: number;
};

// placeholder file
export function coerce(
   s: TSchema,
   _value: unknown,
   opts: CoercionOptions = {}
): unknown {
   const value = structuredClone(_value);
   const ctx: Required<CoercionOptions> = {
      resolver: opts.resolver || new Resolver(s),
      depth: opts.depth || 0,
   };

   if (ctx.resolver.hasRef(s, value)) {
      return ctx.resolver.resolve(s.$ref).coerce(value, {
         ...ctx,
         depth: ctx.depth + 1,
      });
   }

   return value;
}
