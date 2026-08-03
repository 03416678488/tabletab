import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsUniqueArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any[]) {
          if (!Array.isArray(value)) return false;
          const unique = new Set(value);
          return unique.size === value.length;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain only unique values.`;
        },
      },
    });
  };
}
