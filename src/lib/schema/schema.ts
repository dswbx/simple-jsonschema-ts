import type { OptionallyOptional, StaticConstEnum } from "../static";
import { isObject } from "../utils";
import { error, valid } from "../utils/details";
import { coerce, type CoercionOptions } from "../validation/coerce";
import { Resolver } from "../validation/resolver";
import type {
   ValidationOptions,
   ValidationResult,
} from "../validation/validate";
import { validate } from "../validation/validate";

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
   // needed for boolean schemas
   toJSON: () => object;
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

   [key: string]: any;
}

export interface TCustomType
   extends TJsonSchemaBaseOptions,
      Partial<TSchemaFn> {}

export class SchemaType<
   Options extends TCustomType = TCustomType,
   Type = unknown,
   Coerced = Type
> {
   static: StaticConstEnum<Options, Type>;
   coerced: Options extends {
      coerce: (...args: any[]) => infer C;
   }
      ? OptionallyOptional<Coerced, C>
      : OptionallyOptional<Coerced, StaticConstEnum<Options, Coerced>>;
   _optional: boolean = false;

   protected _template: Type | undefined;
   readonly type: string | undefined;

   constructor(public readonly _schema: Options = {} as Options) {
      this.static = undefined as any;
      this.coerced = undefined as any;
      this.type = undefined as any;
   }

   template(opts?: TSchemaTemplateOptions): any {
      const s = this.getSchema();
      if (s.const !== undefined) return s.const;
      if (s.default !== undefined) return s.default;
      if (s.enum !== undefined) return s.enum[0] as any;
      if (s.template) return s.template(opts) as any;
      return this._template;
   }

   protected getSchema(): TCustomType & { type: string } {
      const { type, ...rest } = isObject(this._schema)
         ? (this._schema as object)
         : ({} as any);
      return {
         type: this.type,
         ...rest,
         coerce: (...args) => {
            if (this._schema.coerce) {
               return this._schema.coerce(...args);
            }
            return this._coerce(...args);
         },
      };
   }

   static true<TrueSchema extends TCustomType>(
      s: TrueSchema = {} as TrueSchema
   ) {
      return new SchemaType<TrueSchema, unknown, unknown>({
         ...s,
         toJSON: () => true,
         validate: () => {
            return valid();
         },
      });
   }

   static false<FalseSchema extends TCustomType>(
      s: FalseSchema = {} as FalseSchema
   ) {
      return new SchemaType<FalseSchema, never, never>({
         ...s,
         toJSON: () => false,
         validate: (v, opts) => {
            return error(opts, "", "Always fails");
         },
      });
   }

   protected _coerce(value: unknown, opts?: CoercionOptions): Coerced {
      return value as any;
   }
   coerce(value: unknown, opts?: CoercionOptions): Coerced {
      const ctx: Required<CoercionOptions> = {
         ...opts,
         resolver: opts?.resolver || new Resolver(this),
         depth: opts?.depth ? opts.depth + 1 : 0,
      };

      const s = this.getSchema();
      if ("coerce" in s && s.coerce !== undefined) {
         return s.coerce(value, ctx) as any;
      }

      return coerce(this, this._coerce(value, ctx), ctx) as any;
   }

   validate(value: unknown, opts?: ValidationOptions) {
      const s = this.getSchema();
      const ctx: Required<ValidationOptions> = {
         keywordPath: opts?.keywordPath || [],
         instancePath: opts?.instancePath || [],
         coerce: opts?.coerce || false,
         errors: opts?.errors || [],
         shortCircuit: opts?.shortCircuit || false,
         ignoreUnsupported: opts?.ignoreUnsupported || false,
         resolver: opts?.resolver || new Resolver(this),
         depth: opts?.depth ? opts.depth + 1 : 0,
      };

      if ("validate" in s && s.validate !== undefined) {
         const result = s.validate(value, ctx);
         if (!result.valid) {
            return result;
         }
      }

      return validate(s as any, value, ctx);
   }

   optional<T extends SchemaType<any, any, any>>(
      this: T
   ): T extends SchemaType<infer O, infer T, infer C>
      ? SchemaType<O, T | undefined, C | undefined>
      : never {
      this._optional = true;
      return this as any;
   }

   toJSON() {
      if (this._schema.toJSON) return this._schema.toJSON();
      return JSON.parse(JSON.stringify(this.getSchema()));
   }
}
