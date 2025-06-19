import type { OptionallyOptional, StaticConstEnum } from "../static";
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
   template?: (opts?: TSchemaTemplateOptions) => unknown;
}

export interface ISchemaOptions
   extends IBaseSchemaOptions,
      Partial<ISchemaFn> {}

export type StrictOptions<S extends ISchemaOptions, O extends S> = O & {
   [K in Exclude<keyof O, keyof S>]: never;
};

export const symbol = Symbol.for("schema");

export class Schema<
   Options extends ISchemaOptions = ISchemaOptions,
   Type = unknown,
   Coerced = Type
> {
   readonly type: string | undefined;
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

   template(opts?: TSchemaTemplateOptions): Type {
      const s = this as ISchemaOptions;

      if (s.const !== undefined) return s.const;
      if (s.default !== undefined) return s.default;
      if (s.enum !== undefined) return s.enum[0] as any;
      if (this[symbol].raw?.template) {
         return this[symbol].raw.template(opts) as any;
      }

      return this[symbol].overrides?.template?.(opts) as any;
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
   ): T extends Schema<infer O>
      ? Schema<
           O,
           T[typeof symbol]["static"] | undefined,
           T[typeof symbol]["coerced"] | undefined
        >
      : never {
      this[symbol].optional = true;
      return this as any;
   }

   // cannot force type this one
   // otherwise ISchemaOptions must be widened to include any
   toJSON(): object {
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
