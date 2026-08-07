import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Customer } from './entities/customer.entity';
import { CustomerFavorite } from './entities/customer-favorite.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerFavoritesController } from './customer-favorites.controller';
import { CustomerFavoritesService } from './customer-favorites.service';
import { CustomerValidatorService } from './services/customer-validator.service';
import { CustomerHelperService } from './services/customer.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerFavorite]),
    PaginationModule,
    ErrorModule,
    // Provides RateLimitService for the @RateLimit decorators on customer auth.
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CustomerController, CustomerAuthController, CustomerFavoritesController],
  providers: [
    CustomerService,
    CustomerAuthService,
    CustomerFavoritesService,
    CustomerValidatorService,
    CustomerHelperService,
    tenantRepositoryProvider(Customer),
    tenantRepositoryProvider(CustomerFavorite),
  ],
  exports: [CustomerService, TypeOrmModule],
})
export class CustomerModule {}
