import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FileUploadConfigDto {
  @IsBoolean()
  isMultiple: boolean;

  @IsString()
  @IsIn(['csv', 'xlsx', 'pdf', 'image', 'json'], {
    message: 'File type must be one of: csv, xlsx, pdf, image, json',
  })
  type: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  maxFiles?: number = 10;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1024) // 1KB minimum
  maxSizeBytes?: number;
}
