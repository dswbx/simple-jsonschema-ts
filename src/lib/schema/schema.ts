import { $kind, $optional, $raw } from "../symbols";
import type { Static, StaticCoerced, StaticConstEnum } from "../static";
import { isBoolean, isObject } from "../utils";
import { validate } from "../validation/validate";
import type {
   ValidationResult,
   ValidationOptions,
} from "../validation/validate";
import { error, valid } from "../utils/details";
import { coerce, type CoercionOptions } from "../validation/coerce";
import { Resolver } from "../validation/resolver";

export type PropertyName = string;
export type JSONSchemaTypeName =
   | "string"
   | "number"
   | "integer"
   | "boolean"
   | "object"
   | "array"
   | "null";

export type TSchemaTemplateOptions = {
   withOptional?: boolean;
};

export interface TSchemaFn {
   validate: (value: unknown, opts?: ValidationOptions) => ValidationResult;
   template: (opts?: TSchemaTemplateOptions) => unknown;
   coerce: (value: unknown, opts?: CoercionOptions) => unknown;
   // @todo: remove this
   toJSON: () => object;
}

export interface TAnySchema<Type = unknown> {
   optional: (() => TOptional) | never;
   coerce: (value: unknown) => Type;
   static: Type;
   [$kind]: string;
   [$raw]: any;
   [$optional]?: boolean | never;
}

export interface TOptional<Schema extends SchemaType = SchemaType>
   extends TSchema {
   optional: never;
   [$optional]: true;
   static: Static<Schema> | undefined;
   coerce: (v: unknown) => StaticCoerced<Schema> | undefined;
}

export interface TJsonSchemaBaseOptions {
   // basic/meta
   $id?: string;
   $ref?: string;
   $schema?: string;
   title?: string;
   description?: string;
   default?: any;
   readOnly?: boolean;
   writeOnly?: boolean;
   $comment?: string;
   examples?: any[];
   enum?: readonly any[] | any[];
   const?: any;
}

export interface TCustomType
   extends TJsonSchemaBaseOptions,
      Partial<TSchemaFn> {}

export interface TSchemaBase extends TJsonSchemaBaseOptions {
   $defs?: { [key in PropertyName]: TSchemaBase };

   // data types & common
   type?: JSONSchemaTypeName | JSONSchemaTypeName[];

   // string
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;

   // number
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;

   // array
   items?: TSchemaBase | boolean;
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
   contains?: TSchemaBase;
   minContains?: number;
   maxContains?: number;
   prefixItems?: TSchemaBase[];

   // object
   properties?: { [key in PropertyName]: TSchemaBase };
   patternProperties?: { [key: string]: TSchemaBase };
   additionalProperties?: TSchemaBase | boolean;
   required?: PropertyName[];
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: TSchemaBase;
   dependentRequired?: { [key in PropertyName]: PropertyName[] };
   dependentSchemas?: { [key in PropertyName]: TSchemaBase };

   // Combining schemas
   allOf?: TSchemaBase[];
   anyOf?: TSchemaBase[];
   oneOf?: TSchemaBase[];
   not?: TSchemaBase;
   if?: TSchemaBase;
   then?: TSchemaBase;
   else?: TSchemaBase;
}

export interface TSchema<Type = unknown> extends TSchemaBase, TSchemaFn {
   optional: () => TOptional<this>;
   coerce: (value: unknown, opts?: CoercionOptions) => Type;
   static: Type;
   [$kind]: string;
   [$raw]: any;
   //[$optional]: boolean;

   // overrides
   $defs?: { [key in PropertyName]: TSchema };
   items?: TSchema;
   contains?: TSchema;
   prefixItems?: TSchema[];
   properties?: { [key in PropertyName]: TSchema };
   patternProperties?: { [key: string]: TSchema };
   additionalProperties?: TSchema;
   propertyNames?: TSchema;
   dependentSchemas?: { [key in PropertyName]: TSchema };
   allOf?: TSchema[];
   anyOf?: TSchema[];
   oneOf?: TSchema[];
   not?: TSchema;
   if?: TSchema;
   then?: TSchema;
   else?: TSchema;
}

export type TCustomSchema<
   Options extends TSchemaBase,
   Fallback = unknown
> = TSchema & {
   static: StaticConstEnum<Options, Fallback>;
   optional: () => TOptional<TCustomSchema<Options, Fallback>>;
   coerce: (value: unknown) => StaticConstEnum<Options, Fallback>;
} & {
   [K in keyof Options]: Options[K];
} & TSchemaFn;

export interface TSchemaInOut<Type, TypeCoerced>
   extends Omit<TSchema<Type>, "coerce"> {
   coerce: (value: unknown, opts?: CoercionOptions) => TypeCoerced;
}

export const schema = <
   const Type = unknown,
   const S extends Partial<TSchema> | boolean = Partial<TSchema>,
   Static = S extends { const?: unknown; enum?: unknown }
      ? StaticConstEnum<S, Type>
      : Type
>(
   _s: S = {} as S,
   kind: string = "any"
): TSchema<Static> => {
   const s = (isObject(_s) ? _s : {}) as unknown as TSchema;
   // @ts-ignore
   const raw = isBoolean(_s) ? _s : $raw in _s ? _s[$raw] : undefined;

   const s2 = {
      ...s,
      [$kind]: kind,
      [$raw]: raw,
      optional: function (this: TSchema) {
         return schema(
            {
               ...this,
               // prevent treating schema validate as custom validate
               validate: undefined,
               [$raw]: raw,
               [$optional]: true,
            },
            kind
         );
      },
      template: function (opts: TSchemaTemplateOptions = {}) {
         // @todo: handle optional here?
         if (s.const !== undefined) return s.const;
         if (s.default !== undefined) return s.default;
         if (s.enum !== undefined) return s.enum[0];
         if (s.template) return s.template(opts);
         return undefined;
      },
      toJSON: function () {
         const raw = this[$raw];
         if (isBoolean(raw)) return raw;
         return JSON.parse(JSON.stringify(s));
      },
   };

   //
   s2.coerce = function (_value: unknown, opts: CoercionOptions = {}) {
      const ctx: Required<CoercionOptions> = {
         ...opts,
         resolver: opts.resolver || new Resolver(s2 as any),
         depth: opts.depth ? opts.depth + 1 : 0,
      };
      let value = _value;

      if ("coerce" in s && s.coerce !== undefined) {
         return s.coerce(value, ctx);
      }

      // @todo: what about default, const, enum?
      return coerce(s2 as any, value, ctx);
   };

   // important to split here, to get all schema methods (required for isSchema check)
   s2.validate = function (value: unknown, opts: ValidationOptions = {}) {
      if (isBoolean(raw)) {
         return raw === false ? error(opts, "", "Always fails") : valid();
      }

      // run custom validate if present
      let errors = opts.errors || [];
      if ("validate" in s && s.validate !== undefined) {
         const result = s.validate(value, opts);
         if (!result.valid) {
            errors = [...errors, ...result.errors];
         }
      }

      return validate(s2 as any, value, {
         ...opts,
         errors,
      });
   };

   return s2 as any;
};

export abstract class SchemaType<
   Options extends TCustomType | boolean = TCustomType,
   Type = unknown
> {
   static: StaticConstEnum<Exclude<Options, boolean>, Type>;
   coerced: Options extends { coerce: (...args: any[]) => unknown }
      ? ReturnType<Options["coerce"]>
      : StaticConstEnum<Exclude<Options, boolean>, Type>;

   protected _template: Type | undefined;
   type: string;

   constructor(public readonly _schema: Options = {} as Options) {
      this.static = undefined as any;
      this.coerced = undefined as any;
      this.type = undefined as any;
   }

   template(opts?: TSchemaTemplateOptions): Type | undefined {
      const s = this.#getSchema();
      if (s.const !== undefined) return s.const;
      if (s.default !== undefined) return s.default;
      if (s.enum !== undefined) return s.enum[0] as any;
      if (s.template) return s.template(opts) as any;
      return this._template;
   }

   coerce(value: unknown, opts?: CoercionOptions): Type {
      const s = this.#getSchema();
      if ("coerce" in s && s.coerce !== undefined) {
         return s.coerce(value, opts) as any;
      }
      return value as any;
   }

   #getSchema(): TCustomType & { type: string } {
      const { type, ...rest } = isObject(this._schema)
         ? (this._schema as object)
         : ({} as any);
      return {
         type: this.type,
         ...rest,
      };
   }

   validate(value: unknown, opts?: ValidationOptions) {
      if (isBoolean(this._schema)) {
         return this._schema === false
            ? error(opts, "", "Always fails")
            : valid();
      }

      const s = this.#getSchema();

      if ("validate" in s && s.validate !== undefined) {
         const result = s.validate(value, opts);
         if (!result.valid) {
            return result;
         }
      }

      return validate(s as any, value, opts);
   }

   optional<T extends SchemaType<any, any>>(this: T): TOptional<T> {
      // @todo: check this
      return this as any;
   }

   toJSON() {
      return JSON.parse(JSON.stringify(this.#getSchema()));
   }
}
