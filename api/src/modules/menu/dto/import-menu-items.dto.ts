import { IsNotEmpty, IsString } from 'class-validator';

export class ImportMenuItemsDto {
  /** Raw CSV text (the client reads the uploaded file and posts its contents). */
  @IsString()
  @IsNotEmpty()
  csv: string;
}
