import { SchemaType } from "../schema";

export const toJsonPointer = (path: (string | number)[] = [], prefix = "") => {
   return (
      "/" +
      [
         prefix,
         ...path.map((p) => {
            return String(p).replace(/\./g, "/");
         }),
      ]
         .filter(Boolean)
         .join("/")
   );
};

export const fromJsonPointer = (pointer: string) => {
   return pointer.split("/").slice(1);
};

export function getJsonPath(
   object: object | SchemaType,
   _path: string | (string | number)[],
   defaultValue = undefined
): any {
   const path =
      typeof _path === "string" ? fromJsonPointer(_path) : toJsonPointer(_path);
   return getPath(object, path, defaultValue);
}

export function getPath(
   object: object | SchemaType,
   _path: string | (string | number)[],
   defaultValue = undefined
): any {
   const path =
      typeof _path === "string"
         ? _path.split(/[.\[\]\"]+/).filter((x) => x)
         : _path;

   if (path.length === 0) {
      return object;
   }

   try {
      const [head, ...tail] = path;
      if (!head || !(head in object)) {
         return defaultValue;
      }

      return getPath(object[head], tail, defaultValue);
   } catch (error) {
      if (typeof defaultValue !== "undefined") {
         return defaultValue;
      }

      throw new Error(`Invalid path: ${path.join(".")}`);
   }
}
