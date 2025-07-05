import type {
   Context,
   Env,
   Input,
   MiddlewareHandler,
   ValidationTargets,
} from "hono";
import { validator as honoValidator } from "hono/validator";
import type { Static, StaticCoerced, Schema } from "jsonv-ts";
import { $symbol } from "./shared";

export type Options = {
   coerce?: boolean;
   includeSchema?: boolean;
   skipOpenAPI?: boolean;
};

type ValidationResult = {
   valid: boolean;
   errors: {
      keywordLocation: string;
      instanceLocation: string;
      error: string;
      data?: unknown;
   }[];
};

export type Hook<T, E extends Env, P extends string> = (
   result: { result: ValidationResult; data: T },
   c: Context<E, P>
) => Response | Promise<Response> | void;

export const validator = <
   S extends Schema,
   Target extends keyof ValidationTargets,
   E extends Env,
   P extends string,
   Opts extends Options = Options,
   Out = Opts extends { coerce: false } ? Static<S> : StaticCoerced<S>,
   I extends Input = {
      in: { [K in Target]: Static<S> };
      out: { [K in Target]: Out };
   }
>(
   target: Target,
   schema: S,
   options?: Opts,
   hook?: Hook<Out, E, P>
): MiddlewareHandler<E, P, I> => {
   const middleware = honoValidator(target, async (_value, c) => {
      const value = options?.coerce !== false ? schema.coerce(_value) : _value;
      // @ts-ignore
      const result = schema.validate(value);
      if (!result.valid) {
         return c.json({ ...result, schema }, 400);
      }

      if (hook) {
         const hookResult = hook({ result, data: value as Out }, c);
         if (hookResult) {
            return hookResult;
         }
      }

      return value as Out;
   });

   if (options?.skipOpenAPI) {
      return middleware as any;
   }

   return Object.assign(middleware, {
      [$symbol]: {
         type: "parameters",
         value: {
            target,
            schema,
         },
      },
   }) as any;
};
