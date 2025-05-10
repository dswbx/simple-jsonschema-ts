import {
   type StaticConstEnum,
   type TSchema,
   type TSchemaWithFn,
   create,
} from "../base";
import type { NumberSchema } from "../types";

export interface TNumber<S extends NumberSchema>
   extends TSchema<"number">,
      NumberSchema {
   static: StaticConstEnum<S, number>;
}

export const number = <const S extends TSchemaWithFn<NumberSchema>>(
   schema?: S
) =>
   create<TNumber<S>>("number", {
      coerce: (value) => Number(value),
      template,
      ...schema,
      type: "number",
   });

export const integer = <const S extends TSchemaWithFn<NumberSchema>>(
   schema?: S
) =>
   create<TNumber<S>>("integer", {
      coerce: (value) => Number(value),
      template,
      ...schema,
      type: "integer",
   });

function template(this: NumberSchema) {
   if (this.minimum) return this.minimum;
   if (this.exclusiveMinimum) {
      if (this.multipleOf) {
         let result = this.exclusiveMinimum;
         while (result % this.multipleOf !== 0) {
            result++;
         }
         return result;
      }
      return this.exclusiveMinimum + 1;
   }
   return 0;
}
