import { type Static, type TSchema, type TSchemaWithFn, create } from "../base";
import { $kind } from "../symbols";
import type { ArraySchema } from "../types";
import { isSchema, invariant } from "../utils";

export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ArrayStatic<T extends TSchema> = Static<T>[] & {};

export interface TArray<
   Items extends TSchema = TSchema,
   Contains extends TSchema = TSchema
> extends TSchema<"array">,
      ArraySchema<Items, Contains> {
   static: ArrayStatic<Items>;
}

export const array = <
   const Items extends TSchema,
   O extends TSchemaWithFn<ArraySchema>
>(
   items: Items | boolean,
   options?: O & { contains?: TSchema; prefixItems?: TSchema[] }
) => {
   if (items !== undefined) {
      invariant(isSchema(items), "items must be a schema", items);
   }

   return create<TArray<Items>>("array", {
      template: () => [],
      coerce,
      ...options,
      type: "array",
      items,
      [$kind]: "array",
   });
};

function coerce(this: ArraySchema, _value: unknown) {
   const value = typeof _value === "string" ? JSON.parse(_value) : _value;
   if (!Array.isArray(value)) {
      return undefined;
   }

   if (this.items) {
      for (const [index, item] of value.entries()) {
         // @ts-ignore
         value[index] = this.items.coerce(item);
      }
   }

   return value;
}
