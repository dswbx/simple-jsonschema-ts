type ExtractParams<T> = T extends `${infer _Start}{${infer Param}}${infer Rest}`
   ? { [K in Param | keyof ExtractParams<Rest>]: string }
   : {};

export type TResourceUri = `${string}://${string}`;

export function extractParamValues(
   template: string,
   actual: string
): Record<string, string> {
   const regex = new RegExp(
      "^" +
         template.replace(/[{](.*?)[}]/g, (_, key) => `(?<${key}>[^/]+)`) +
         "$"
   );
   const match = actual.match(regex);
   return match?.groups ?? {};
}

export function matchPath(template: string, actual: string): boolean {
   const regex = new RegExp(
      "^" + template.replace(/[{](.*?)[}]/g, "[^/]+") + "$"
   );
   return regex.test(actual);
}

export type ResourceOptions = {
   mimeType?: string;
   description?: string;
};

export type ResourceResponse = {
   mimeType?: string;
} & (
   | {
        text: string;
     }
   | { blob: string }
);

export class Resource<
   Name extends string,
   Uri extends TResourceUri,
   Params = Uri extends TResourceUri ? ExtractParams<Uri> : never
> {
   constructor(
      public readonly name: Name,
      public readonly uri: Uri,
      public readonly handler: (
         params: Params,
         context: object
      ) => Promise<ResourceResponse>,
      public readonly options: ResourceOptions = {
         mimeType: "text/plain",
      }
   ) {}

   isDynamic(): boolean {
      return this.uri.includes("{");
   }

   matches(uri: Uri): boolean {
      return matchPath(this.uri, uri);
   }

   async call(uri: TResourceUri, context: object): Promise<ResourceResponse> {
      const params = extractParamValues(this.uri, uri) as Params;
      return await this.handler(params, context);
   }

   async toJSONContent(context: object = {}, uri: TResourceUri = this.uri) {
      const { uriTemplate, ...rest } = this.toJSON();
      return {
         ...rest,
         uri,
         ...(await this.call(uri, context)),
      };
   }

   toJSON() {
      return {
         [this.isDynamic() ? "uriTemplate" : "uri"]: this.uri,
         name: this.name,
         mimeType: this.options.mimeType,
         description: this.options.description,
      };
   }
}

export function resource<
   Name extends string = string,
   Uri extends TResourceUri = TResourceUri,
   Params = Uri extends TResourceUri ? ExtractParams<Uri> : never
>(opts: {
   name: Name;
   uri: Uri;
   handler: (params: Params, context: object) => Promise<ResourceResponse>;
}) {
   const { name, uri, handler, ...options } = opts;
   return new Resource(name, uri, handler, options);
}
