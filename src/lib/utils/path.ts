export const toJsonPointer = (path: string[] = [], prefix = "") => {
   return (
      "/" +
      [
         prefix,
         ...path.map((p) => {
            return p.replace(/\./g, "/");
         }),
      ]
         .filter(Boolean)
         .join("/")
   );
};

export const fromJsonPointer = (pointer: string) => {
   return pointer.split("/").slice(1);
};
