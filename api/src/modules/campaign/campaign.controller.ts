import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CampaignService } from './campaign.service';
import {
  CreateCampaignDto,
  GetCampaignQueryDto,
  UpdateCampaignDto,
  WhatsappConfigDto,
} from './dto';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly _campaignService: CampaignService) {}

  // WhatsApp connection settings (declared before `:id`).
  @Get('config')
  getConfig() {
    return this._campaignService.getConfig();
  }

  @Put('config')
  saveConfig(@Body() dto: WhatsappConfigDto) {
    return this._campaignService.saveConfig(dto);
  }

  /** Approved WhatsApp templates from Meta, for the campaign composer. */
  @Get('templates')
  getTemplates() {
    return this._campaignService.getTemplates();
  }

  @Get()
  getAll(@Query() query: GetCampaignQueryDto) {
    return this._campaignService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._campaignService.getById(id);
  }

  @Get(':id/recipients')
  getRecipients(@Param('id', ParseUUIDPipe) id: string) {
    return this._campaignService.getRecipients(id);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this._campaignService.createCampaign(dto);
  }

  @Post(':id/send')
  send(@Param('id', ParseUUIDPipe) id: string) {
    return this._campaignService.send(id);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCampaignDto) {
    return this._campaignService.updateCampaign(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this._campaignService.deleteCampaign(id);
  }
}
