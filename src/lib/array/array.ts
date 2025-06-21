import {
   Schema,
   type ISchemaOptions,
   type StrictOptions,
} from "../schema/schema";
import type { Static, StaticCoerced } from "../static";
import { isSchema } from "../utils";

type ArrayStatic<T extends Schema> = Static<T>[] & {};
type ArrayCoerced<T extends Schema> = StaticCoerced<T>[] & {};

export interface IArrayOptions extends ISchemaOptions {
   $defs?: Record<string, Schema>;
   contains?: Schema;
   minContains?: number;
   maxContains?: number;
   prefixItems?: Schema[];
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
}

export class ArraySchema<
   const Items extends Schema,
   const O extends IArrayOptions
> extends Schema<O, ArrayStatic<Items>, ArrayCoerced<Items>> {
   override readonly type = "array";

   constructor(public readonly items?: Items, options: O = {} as O) {
      super(
         {
            ...options,
            items,
         },
         {
            template: (value) => {
               if (value === undefined || !Array.isArray(value)) return [];
               return value;
            },
            coerce: (_value, opts) => {
               try {
                  const value =
                     typeof _value === "string" ? JSON.parse(_value) : _value;
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
            },
         }
      );
      this.items = items;
   }
}

export const array = <
   const Items extends Schema,
   const O extends IArrayOptions
>(
   items?: Items,
   options?: StrictOptions<IArrayOptions, O>
): ArraySchema<Items, O> & O => new ArraySchema(items, options) as any;
