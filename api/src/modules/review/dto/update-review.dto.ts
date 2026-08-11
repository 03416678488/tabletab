import { IsIn, IsOptional } from 'class-validator';

/** Admin moderation — approve or reject a pending review. */
const STATUSES = ['pending', 'approved', 'rejected'];

export class UpdateReviewDto {
  @IsIn(STATUSES)
  @IsOptional()
  status?: string;
}
