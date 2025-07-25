import type { OpenAPIV3_1 } from "openapi-types";
import type { Context } from "hono";
import type { Env, Input, BlankInput } from "hono/types";

export type Document = OpenAPIV3_1.Document;
export type Info = OpenAPIV3_1.InfoObject;
export type Server = OpenAPIV3_1.ServerObject;
export type Paths = OpenAPIV3_1.PathsObject;
export type PathItemObject = OpenAPIV3_1.PathItemObject;
export type Components = OpenAPIV3_1.ComponentsObject;
export type SecurityRequirement = OpenAPIV3_1.SecurityRequirementObject;
export type Tag = OpenAPIV3_1.TagObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
export type ParameterObject = OpenAPIV3_1.ParameterObject;

export type DescribeRouteOptions = Omit<
   OpenAPIV3_1.OperationObject,
   "responses"
> & {
   /**
    * Pass `true` to hide route from OpenAPI/swagger document
    */
   hide?:
      | boolean
      | (<
           E extends Env = Env,
           P extends string = string,
           I extends Input = BlankInput
        >(
           c: Context<E, P, I>
        ) => boolean);

   /**
    * Responses of the request
    */
   responses?: {
      [key: string]:
         | (OpenAPIV3_1.ResponseObject & {
              content?: {
                 [key: string]: Omit<OpenAPIV3_1.MediaTypeObject, "schema"> & {
                    schema?:
                       | OpenAPIV3_1.ReferenceObject
                       | OpenAPIV3_1.SchemaObject;
                 };
              };
           })
         | OpenAPIV3_1.ReferenceObject;
   };
};
