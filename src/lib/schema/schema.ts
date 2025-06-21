import type { OptionallyOptional, Simplify, StaticConstEnum } from "../static";
import type { JSONSchemaDefinition } from "../types";
import { error, valid } from "../utils/details";
import { coerce, type CoercionOptions } from "../validation/coerce";
import { Resolver } from "../validation/resolver";
import {
   validate,
   type ValidationOptions,
   type ValidationResult,
} from "../validation/validate";

export type TSchemaTemplateOptions = {
   withOptional?: boolean;
   withExtendedOptional?: boolean;
};

export interface IBaseSchemaOptions {
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

export interface ISchemaFn {
   validate?: (value: unknown, opts?: ValidationOptions) => ValidationResult;
   coerce?: (value: unknown, opts?: CoercionOptions) => unknown;
   template?: (value?: unknown, opts?: TSchemaTemplateOptions) => unknown;
}

export interface ISchemaOptions
   extends IBaseSchemaOptions,
      Partial<ISchemaFn> {}

export type StrictOptions<S extends ISchemaOptions, O extends S> = O & {
   [K in Exclude<keyof O, keyof S>]: never;
};

export const symbol = Symbol.for("schema");

export interface IAnySchema extends IBaseSchemaOptions {
   [symbol]: any;
   toJSON(): object;
}

export class Schema<
   Options extends ISchemaOptions = ISchemaOptions,
   Type = unknown,
   Coerced = Type
> implements IBaseSchemaOptions
{
   [symbol]!: {
      raw?: Options | any;
      static: StaticConstEnum<Options, Type>;
      coerced: Options extends {
         coerce: (...args: any[]) => infer C;
      }
         ? OptionallyOptional<Coerced, C>
         : OptionallyOptional<Coerced, StaticConstEnum<Options, Coerced>>;
      optional: boolean;
      overrides?: ISchemaFn;
   };

   readonly type: string | undefined;
   $id?: string;
   $ref?: string;
   $schema?: string;
   title?: string;
   description?: string;
   readOnly?: boolean;
   writeOnly?: boolean;
   $comment?: string;
   examples?: any[];
   //const?: any;

   constructor(o?: Options, overrides?: ISchemaFn) {
      // just prevent overriding properties
      const { type, validate, coerce, template, ...rest } = (o || {}) as any;
      // make sure type is the first property
      Object.assign(this, { type }, rest);

      // @ts-expect-error shouldn't trash console
      this[symbol] = {
         raw: o,
         optional: false,
         overrides,
      };
   }

   template(_value?: unknown, opts?: TSchemaTemplateOptions): Type {
      const s = this as ISchemaOptions;
      let value = _value;

      // if const is defined, ignore initial
      if (s.const !== undefined) {
         value = s.const;
      } else if (!value) {
         // if no value, use enum or default
         if (s.default !== undefined) value = s.default;
         if (opts?.withExtendedOptional && s.enum !== undefined) {
            value = s.enum[0] as any;
         }
      }

      if (
         opts?.withOptional !== true &&
         value === undefined &&
         this.isOptional()
      ) {
         return value as any;
      }

      if (this[symbol].raw?.template) {
         const rawTmpl = this[symbol].raw.template(value, opts) as any;
         if (rawTmpl !== undefined) {
            value = rawTmpl;
         }
      }

      const tmpl = this[symbol].overrides?.template?.(value, opts) as any;
      if (tmpl !== undefined) {
         value = tmpl;
      }
      return value as Type;
   }

   validate(value: unknown, opts?: ValidationOptions): ValidationResult {
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

      const customValidate = this[symbol].raw?.validate;
      if (customValidate !== undefined) {
         const result = customValidate(value, ctx);
         if (!result.valid) {
            return result;
         }
      }

      return validate(this, value, ctx);
   }

   coerce(value: unknown, opts?: CoercionOptions) {
      const ctx: Required<CoercionOptions> = {
         ...opts,
         resolver: opts?.resolver || new Resolver(this),
         depth: opts?.depth ? opts.depth + 1 : 0,
      };

      const customCoerce = this[symbol].raw?.coerce;
      if (customCoerce !== undefined) {
         return customCoerce(value, ctx) as any;
      }
      const coerced = this[symbol].overrides?.coerce?.(value, ctx) ?? value;
      return coerce(this, coerced, ctx) as any;
   }

   optional<T extends Schema>(
      this: T
   ): T extends Schema<infer O, infer S, infer C>
      ? Simplify<Pick<T, Exclude<keyof T, keyof Schema>>> &
           Schema<
              O,
              S extends unknown
                 ? T[typeof symbol]["static"] | undefined
                 : S | undefined,
              C extends unknown
                 ? T[typeof symbol]["coerced"] | undefined
                 : C | undefined
           >
      : never {
      this[symbol].optional = true;
      return this as any;
   }

   isOptional(): boolean {
      return this[symbol].optional;
   }

   // cannot force type this one
   // otherwise ISchemaOptions must be widened to include any
   toJSON(): JSONSchemaDefinition {
      const { toJSON, ...rest } = this;
      return JSON.parse(JSON.stringify(rest));
   }
}

export function createSchema<
   O extends ISchemaOptions,
   Type = unknown,
   Coerced = Type
>(type: string, o?: O, overrides?: ISchemaFn): Schema<O, Type, Coerced> & O {
   return new (class extends Schema<O, Type, Coerced> {
      override readonly type = type;
   })(o, overrides) as any;
}

export function booleanSchema<B extends boolean>(bool: B) {
   return new (class extends Schema<
      ISchemaOptions,
      B extends true ? unknown : never
   > {
      override toJSON() {
         return bool as any;
      }
      override validate(value: unknown, opts?: ValidationOptions) {
         return bool ? valid() : error(opts, "", "Always fails");
      }
   })();
}
