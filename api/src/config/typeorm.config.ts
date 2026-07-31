import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const TypeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: ['./dist/**/*.entity.js'],
  migrations: ['./dist/**/migrations/*.js'],
  subscribers: ['./src/modules/**/subscribers/*.ts'],
  migrationsRun: false,
  synchronize: false,
  autoLoadEntities: true,
  // namingStrategy: new SnakeNamingStrategy(),
  // logging: ['query', 'error', 'schema'],
  logging: false,
};

export default TypeOrmConfig;
