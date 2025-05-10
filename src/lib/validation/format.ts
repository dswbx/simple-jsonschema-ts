import type { ValidationOptions } from "../base";
import { InvalidTypeError } from "../errors";
import type { TAny } from "../misc/any";
import { isString } from "../utils";
import { error, valid } from "../utils/details";

const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function date(str: string) {
   // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
   const matches = str.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/);
   if (!matches) return false;

   const year = +matches[1]!;
   const month = +matches[2]!;
   const day = +matches[3]!;
   const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

   return (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= (month == 2 && isLeapYear ? 29 : DAYS[month])!
   );
}

const formats = {
   date,
};

export const format = (
   { format }: TAny,
   value: unknown,
   opts: ValidationOptions = {}
) => {
   if (!isString(value)) throw new InvalidTypeError("string");
   if (format && !formats[format]) {
      return valid();
      //return error(opts, "format", `Expected format: ${format}`, value);
   }
   if (format && formats[format](value)) {
      return valid();
   }
   return error(opts, "format", `Expected format: ${format}`, value);
};
