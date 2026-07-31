import { BadRequestException, ValidationPipe } from '@nestjs/common';

export const CustomValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (errors) => {
    const result = errors.map((error) => ({
      property: error.property,
      message: error.constraints[Object.keys(error.constraints)[0]],
    }));
    return new BadRequestException(result);
  },
  stopAtFirstError: true,
});
