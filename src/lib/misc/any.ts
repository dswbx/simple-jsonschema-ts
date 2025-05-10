import type { StaticConstEnum, TSchema } from "../base";
import { create } from "../base";
import type { TSchemaWithFn } from "../base";
import type { JSONSchema } from "../types";

export interface TAny<S extends JSONSchema<TSchema> = JSONSchema<TSchema>>
   extends JSONSchema<TSchema>,
      TSchema {
   static: StaticConstEnum<S, any>;
}

export const any = <const S extends JSONSchema<TSchema>>(
   options?: TSchemaWithFn<S>
) => {
   return create<TAny<S>>("any", options);
};
