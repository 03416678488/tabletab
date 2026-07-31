import * as Joi from 'joi';

export const validationSchema = Joi.object({
  APP_NAME: Joi.string().default('tabletap'),
  APP_DESCRIPTION: Joi.string().default('tabletap'),
  APP_VERSION: Joi.string().default('1.0.0'),
  APP_PORT: Joi.number().default(3000),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DATABASE: Joi.string().required(),
  RUN_MIGRATIONS: Joi.boolean().truthy('true').falsy('false').default(false),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_USERNAME: Joi.string().required(),
  REDIS_PASSWORD: Joi.string().required(),
  REDIS_TTL: Joi.number().min(0).default(0),
  REDIS_MAX: Joi.number().min(1).default(100),
});
