import type { ValidationOptions, ValidationResult } from "../base";
import { toJsonPointer } from "./path";

export type ErrorDetail = {
   keywordLocation: string;
   instanceLocation: string;
   error: string;
   data?: unknown;
};

export const error = (
   opts: Omit<ValidationOptions, "coerce"> | undefined = {},
   keyword: string,
   error?: string,
   data?: unknown
): ValidationResult => {
   return {
      valid: false,
      errors: [
         {
            keywordLocation: toJsonPointer([
               ...(opts.keywordPath ?? []),
               keyword,
            ]),
            instanceLocation: toJsonPointer(opts.instancePath),
            error:
               typeof error === "string"
                  ? error
                  : `Invalid value for ${keyword}`,
            data,
         },
      ],
   };
};

export const valid = (): ValidationResult => {
   return {
      valid: true,
      errors: [],
   };
};

export const makeOpts = (
   opts: ValidationOptions,
   _keyword: string | string[],
   _instance?: string | string[]
) => {
   const keyword = Array.isArray(_keyword) ? _keyword : [_keyword];
   const instance = _instance
      ? Array.isArray(_instance)
         ? _instance
         : [_instance]
      : [];

   return {
      ...opts,
      keywordPath: [...(opts.keywordPath ?? []), ...keyword],
      instancePath: instance
         ? [...(opts.instancePath ?? []), ...instance]
         : opts.instancePath,
   };
};
