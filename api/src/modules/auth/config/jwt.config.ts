import { registerAs } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export default registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET,
    signOptions: {
      // jsonwebtoken v9 types narrow expiresIn to `StringValue | number`; the
      // env value is a plain string validated by the joi schema.
      expiresIn: process.env.JWT_EXPIRES_IN as JwtSignOptions['expiresIn'],
    },
  }),
);
