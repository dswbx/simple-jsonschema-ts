import type { BaseJSONSchema, JSONSchemaTypeName, PropertyName } from "./types";
import { valid, type ErrorDetail } from "./utils/details";
import { validateTypeKeywords } from "./validation/validate";
import { $kind, $optional } from "./symbols";

export type TSchemaTemplateOptions = {
   withOptional?: boolean;
};

export interface TSchemaFn {
   validate: (value: unknown, opts?: ValidationOptions) => ValidationResult;
   template: (opts?: TSchemaTemplateOptions) => unknown;
   coerce: (value: unknown) => unknown;
}

export interface TSchema<Kind extends string = any> extends TSchemaFn {
   [$kind]: Kind;
   static: unknown;
   $id?: string;
   $ref?: string;
   $schema?: string;
   title?: string;
   description?: string;
   default?: any;
   readOnly?: boolean;
   writeOnly?: boolean;
   $defs?: { [key in PropertyName]: TSchema };
   $comment?: string;
   type?: JSONSchemaTypeName | JSONSchemaTypeName[];
   enum?: readonly any[] | any[];
   const?: any;
}

export type TSchemaWithFn<S extends BaseJSONSchema> = S & Partial<TSchemaFn>;

// from https://github.com/type-challenges/type-challenges/issues/28200
export type Merge<T> = {
   [K in keyof T]: T[K];
};
type OptionalUndefined<
   T,
   Props extends keyof T = keyof T,
   OptionsProps extends keyof T = Props extends keyof T
      ? undefined extends T[Props]
         ? Props
         : never
      : never
> = Merge<
   {
      [K in OptionsProps]?: T[K];
   } & {
      [K in Exclude<keyof T, OptionsProps>]: T[K];
   }
>;
// https://github.com/sindresorhus/type-fest/blob/main/source/simplify.d.ts
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type Static<S extends TSchema> = S["static"] extends Record<
   string,
   unknown
>
   ? Simplify<OptionalUndefined<S["static"]>>
   : S["static"];

export interface TOptional<S extends TSchema> extends TSchema {
   schema: S;
   static: Static<S> | undefined;
}

export type StaticConstEnum<
   Schema extends BaseJSONSchema,
   Fallback = unknown
> = Schema extends { const: infer C }
   ? C
   : Schema extends { enum: infer E }
   ? E extends readonly any[]
      ? [...E][number]
      : E extends any[]
      ? E[number]
      : Fallback
   : Fallback;

export type ValidationOptions = {
   keywordPath?: string[];
   instancePath?: string[];
   coerce?: boolean;
   errors?: ErrorDetail[];
};

export type ValidationResult = {
   valid: boolean;
   errors: ErrorDetail[];
};

export function create<S extends TSchema>(
   kind: string,
   schema: Partial<S> = {}
): S & { optional: () => TOptional<S> } {
   return {
      ...schema,
      [$kind]: kind,
      optional: function (this: S) {
         return create(kind, {
            ...schema,
            [$optional]: true,
         }) as unknown as TOptional<S>;
      },
      coerce: function (this: S, value: unknown) {
         if (schema.coerce) return schema.coerce(value);
         return value;
      },
      validate: function (
         this: S,
         _value: unknown,
         opts: ValidationOptions = {}
      ) {
         if (Array.isArray(this.type)) {
            throw new Error("type arrays not implemented");
         }

         const value = opts?.coerce ? this.coerce(_value) : _value;

         // validate keywords
         const result = validateTypeKeywords(this, value, opts);
         if (!result.valid) return result;

         const todo = [
            //"readOnly",
            "dependentRequired",
            "dependentSchemas",
            "if",
            "then",
            "else",
            "not",
            "$ref",
            "$defs",
         ];
         for (const item of todo) {
            if (this[item]) {
               throw new Error(`${item} not implemented`);
            }
         }
         // @todo: readOnly
         // @todo: dependentRequired
         // @todo: dependentSchemas
         // @todo: if
         // @todo: then
         // @todo: else
         // @todo: not
         // @todo: $ref
         // @todo: $defs

         if (schema.validate) {
            return schema.validate(value, opts);
         }
         return valid();
      },
      template: function (opts: TSchemaTemplateOptions = {}) {
         if (this.default !== undefined) return this.default;
         if (this.const !== undefined) return this.const;
         if (schema.template) return schema.template(opts);
         return undefined;
      },
   } as any;
}
