import { capitalize, splitCamelCase } from '@cor/helpers/string.helpers';

export class ErrorPayloadBuilderServices {
  buildUniqueValidationErrorPayload(fields: string[], values: Record<string, any>) {
    return fields.map((field) => ({
      key: field,
      value: values[field],
      message: `${splitCamelCase(capitalize(field))} should be unique.`,
    }));
  }
}
