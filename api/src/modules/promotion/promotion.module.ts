import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Promotion } from './entities/promotion.entity';
import { PromotionRedemption } from './entities/promotion-redemption.entity';
import { PromotionController } from './promotion.controller';
import { PromotionService } from './promotion.service';
import { PromotionHelperService } from './services/promotion.helper.service';
import { PromotionValidatorService } from './services/promotion.validator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, PromotionRedemption])],
  controllers: [PromotionController],
  providers: [PromotionService, PromotionHelperService, PromotionValidatorService],
  exports: [PromotionService, TypeOrmModule],
})
export class PromotionModule {}
