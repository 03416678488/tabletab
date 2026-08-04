import { Module } from '@nestjs/common';

import { TenantModule } from '@modules/tenant/tenant.module';
import { SignupController } from './signup.controller';
import { SignupService } from './signup.service';

@Module({
  imports: [TenantModule],
  controllers: [SignupController],
  providers: [SignupService],
})
export class SignupModule {}
