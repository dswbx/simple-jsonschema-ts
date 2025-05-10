import { Glob } from "bun";
import type { JSONSchema } from "../../lib/types";

export async function getTestFiles(
   draft: string,
   options: { skip?: RegExp[]; only?: RegExp[] } = {}
) {
   const glob = new Glob("**/*.json");
   const files: string[] = [];
   const dir = `${import.meta.dir}/lib/${draft}`;

   for await (const file of glob.scan(dir)) {
      if (options.skip && options.skip.some((r) => r.test(file))) continue;
      if (options.only && !options.only.some((r) => r.test(file))) continue;
      files.push(dir + "/" + file);
   }
   return files;
}

export async function loadTest(file: string) {
   const name = file.split("/").pop()!.replace(".json", "");
   const content = await Bun.file(file).json();

   return { name, content } as {
      name: string;
      content: {
         description: string;
         specification: { core: string; quote: string }[];
         schema: JSONSchema;
         tests: {
            description: string;
            data: unknown;
            valid: boolean;
         }[];
      }[];
   };
}

export function recurisvelyHasKeys(obj: any, keys: string[]) {
   if (keys.length === 0) return true;
   if (typeof obj !== "object" || obj === null) return false;
   return (
      keys.some((key) => key in obj) ||
      Object.values(obj).some((value) => recurisvelyHasKeys(value, keys))
   );
}
