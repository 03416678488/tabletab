import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';

/**
 * Editing is only allowed while a PO is a draft (enforced in the service). The
 * `branchId` can't change after creation — resend as a new PO instead.
 */
export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {}
