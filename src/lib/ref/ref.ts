import { type TCustomType, SchemaType } from "../schema";
import { type Static, type StaticCoerced } from "../static";
import type { CoercionOptions } from "../validation/coerce";
import { isSchema } from "../utils";

export interface TRefType extends SchemaType<{ $id: string }> {}

export class RefType<
   const T extends TRefType | unknown | undefined,
   const Ref extends string | undefined,
   Out = T extends TRefType ? Static<T> : T,
   Coerced = T extends TRefType ? StaticCoerced<T> : T
   // @todo: should be "O"
> extends SchemaType<TCustomType, Out, Coerced> {
   constructor(readonly ref: T, readonly $ref: Ref) {
      if (!$ref && !isSchema(ref)) {
         throw new Error("Ref not set");
      } else if (isSchema(ref) && !ref._schema?.$id) {
         throw new Error("Ref must have an $id");
      }

      super({
         // @ts-ignore
         $ref: $ref ?? ref?._schema.$id,
      });
      this.ref = ref;
   }

   override _coerce(value: unknown, opts?: CoercionOptions): Coerced {
      const ref = this.ref ?? opts?.resolver?.resolve(this.$ref!);
      if (!isSchema(ref)) {
         throw new Error(`Ref not found: ${this.$ref}`);
      }
      return ref.coerce(value, opts) as any;
   }
}

export const ref = <const T extends TRefType, const Ref extends string>(
   ref: T,
   $ref?: Ref
) => {
   return new RefType<T, Ref>(ref, $ref!);
};

export const refId = <T = unknown, const Ref extends string = string>(
   $ref: Ref
): RefType<T, Ref> => {
   return new RefType<T, Ref>(undefined!, $ref!);
};

// @todo: only # refs supported for now
export const recursive = <const T extends SchemaType>(
   cb: (thisSchema: SchemaType) => T
) => {
   return cb(
      new SchemaType({
         $ref: "#",
         coerce: (value: unknown, opts?: CoercionOptions) => {
            const ref = opts?.resolver?.resolve("#");
            if (!isSchema(ref)) {
               throw new Error(`Ref not found: #`);
            }
            return ref.coerce(value, opts) as any;
         },
      })
   ) as T;
};
