import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMediaFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  /** Parent folder to nest under; omit/null for a top-level folder. */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
