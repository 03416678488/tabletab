import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['text', 'template'])
  @IsOptional()
  messageType?: 'text' | 'template';

  @IsString()
  @IsOptional()
  body?: string;

  /** Approved Meta template name (when messageType='template'). */
  @IsString()
  @IsOptional()
  templateName?: string;

  @IsString()
  @IsOptional()
  templateLanguage?: string;

  /** Values for the template's body placeholders; supports {code} / {link}. */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  templateParams?: string[];

  /** Feature a promotion — its code + landing link get appended to the message. */
  @IsUUID()
  @IsOptional()
  promotionId?: string;

  /** ISO timestamp to schedule the send (informational for now). */
  @IsString()
  @IsOptional()
  scheduledAt?: string;
}
