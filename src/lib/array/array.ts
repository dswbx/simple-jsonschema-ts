import { SchemaType, type TCustomType } from "../schema";
import type { Static, StaticCoerced } from "../static";
import { isSchema } from "../utils";
import type { CoercionOptions } from "../validation/coerce";

type ArrayStatic<T extends SchemaType> = Static<T>[] & {};
type ArrayCoerced<T extends SchemaType> = StaticCoerced<T>[] & {};

export interface ArraySchema extends TCustomType {
   $defs?: Record<string, SchemaType>;
   contains?: SchemaType;
   minContains?: number;
   maxContains?: number;
   prefixItems?: SchemaType[];
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
}

export class ArrayType<
   const Items extends SchemaType,
   const O extends ArraySchema
> extends SchemaType<O, ArrayStatic<Items>, ArrayCoerced<Items>> {
   protected _template = [];
   type = "array";

   constructor(public readonly items?: Items, options: O = {} as O) {
      super({
         ...options,
         items,
      });
      this.items = items;
      this.coerced = [] as any;
   }

   override _coerce(_value: unknown, opts?: CoercionOptions) {
      try {
         const value = typeof _value === "string" ? JSON.parse(_value) : _value;
         if (!Array.isArray(value)) {
            return undefined;
         }

         if (isSchema(this.items)) {
            for (const [index, item] of value.entries()) {
               // @ts-ignore
               value[index] = this.items.coerce(item, opts);
            }
         }
         return value;
      } catch (e) {}

      return _value as any;
   }
}

export const array = <
   const Items extends SchemaType,
   const O extends ArraySchema
>(
   items?: Items,
   options: O = {} as O
) => new ArrayType(items, options);
