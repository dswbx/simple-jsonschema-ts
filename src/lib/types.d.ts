export type JSONSchemaTypeName =
   | "string"
   | "number"
   | "integer"
   | "boolean"
   | "object"
   | "array"
   | "null";

export type JSONSchemaDefinition = JSONSchema | boolean;
export type PropertyName = string;

export type BaseJSONSchema = {
   $id?: string;
   $ref?: string;
   $schema?: string;
   title?: string;
   description?: string;
   default?: any;
   readOnly?: boolean;
   writeOnly?: boolean;
   $comment?: string;

   // Data types
   type?: JSONSchemaTypeName | JSONSchemaTypeName[];
   enum?: readonly any[] | any[];
   const?: any;
};

export type StringSchema = BaseJSONSchema & {
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;
};

export type NumberSchema = BaseJSONSchema & {
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;
};

export type BooleanSchema = BaseJSONSchema;

export type ArraySchema<
   Items = JSONSchemaDefinition,
   Contains = JSONSchemaDefinition
> = BaseJSONSchema & {
   items?: Items | boolean;
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
   contains?: Contains;
   minContains?: number;
   maxContains?: number;
   prefixItems?: Contains[];
};

export type ObjectSchema<
   P = BaseJSONSchema,
   PP = P,
   AP = P,
   DP = P,
   PN = P
> = BaseJSONSchema & {
   properties?: { [key in PropertyName]: P };
   patternProperties?: { [key: string]: PP };
   additionalProperties?: AP | boolean;
   required?: PropertyName[];
   maxProperties?: number;
   minProperties?: number;
   dependencies?: {
      [key in PropertyName]: P | PropertyName[];
   };
   propertyNames?: PN | boolean;
};

export interface JSONSchema<S = BaseJSONSchema>
   extends BaseJSONSchema,
      StringSchema,
      NumberSchema,
      BooleanSchema,
      ArraySchema<S, S>,
      ObjectSchema<S> {
   // Combining schemas
   allOf?: S[];
   anyOf?: S[];
   oneOf?: S[];
   not?: S;
   if?: S;
   then?: S;
   else?: S;

   // catch-all for custom extensions
   [key: string | symbol]: any;
}

/**
 * Standard Schema
 */
/** The Standard Schema interface. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
   /** The Standard Schema properties. */
   readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
   /** The Standard Schema properties interface. */
   export interface Props<Input = unknown, Output = Input> {
      /** The version number of the standard. */
      readonly version: 1;
      /** The vendor name of the schema library. */
      readonly vendor: string;
      /** Validates unknown input values. */
      readonly validate: (
         value: unknown
      ) => Result<Output> | Promise<Result<Output>>;
      /** Inferred types associated with the schema. */
      readonly types?: Types<Input, Output> | undefined;
   }

   /** The result interface of the validate function. */
   export type Result<Output> = SuccessResult<Output> | FailureResult;

   /** The result interface if validation succeeds. */
   export interface SuccessResult<Output> {
      /** The typed output value. */
      readonly value: Output;
      /** The non-existent issues. */
      readonly issues?: undefined;
   }

   /** The result interface if validation fails. */
   export interface FailureResult {
      /** The issues of failed validation. */
      readonly issues: ReadonlyArray<Issue>;
   }

   /** The issue interface of the failure output. */
   export interface Issue {
      /** The error message of the issue. */
      readonly message: string;
      /** The path of the issue, if any. */
      readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
   }

   /** The path segment interface of the issue. */
   export interface PathSegment {
      /** The key representing a path segment. */
      readonly key: PropertyKey;
   }

   /** The Standard Schema types interface. */
   export interface Types<Input = unknown, Output = Input> {
      /** The input type of the schema. */
      readonly input: Input;
      /** The output type of the schema. */
      readonly output: Output;
   }

   /** Infers the input type of a Standard Schema. */
   export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
      Schema["~standard"]["types"]
   >["input"];

   /** Infers the output type of a Standard Schema. */
   export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
      Schema["~standard"]["types"]
   >["output"];
}
