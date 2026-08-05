import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SettingModule } from '@modules/setting/setting.module';
import { PromotionModule } from '@modules/promotion/promotion.module';
import { Customer } from '@modules/customer/entities/customer.entity';

import { Campaign } from './entities/campaign.entity';
import { CampaignRecipient } from './entities/campaign-recipient.entity';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignHelperService } from './services/campaign.helper.service';
import { CampaignValidatorService } from './services/campaign.validator.service';
import { WhatsappService } from './services/whatsapp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignRecipient, Customer]),
    SettingModule,
    PromotionModule,
  ],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignHelperService, CampaignValidatorService, WhatsappService],
  exports: [CampaignService],
})
export class CampaignModule {}
