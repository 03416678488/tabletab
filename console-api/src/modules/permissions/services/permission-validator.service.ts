import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { PermissionsEnum, VALID_ACTIONS } from '../enums/permissions.enum';
import { toLowerCase } from '@cor/helpers/string.helpers';

@Injectable()
export class PermissionsValidatorService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}
  async validateCreatePermission(dto: CreatePermissionDto): Promise<void> {
    this.validateRequiredFields(dto);
    this.validateFieldFormats(dto);
    await this.checkDuplicateResource(dto.resource);

    this.validateActions(dto.actions);
  }

  async validateUpdatePermission(id: number, dto: UpdatePermissionDto): Promise<void> {
    await this.checkPermissionExists(id);

    if (dto.resource) {
      await this.checkDuplicateResourceExcludingId(dto.resource, id);
    }

    if (dto.resource) {
      this.validateResourceFormat(dto.resource);
    }

    if (dto.actions) {
      this.validateActions(dto.actions);
    }
  }

  async validateDelete(): Promise<void> {
    const isInUse = await this.isPermissionInUse();
    if (isInUse) {
      throw new ConflictException('Cannot delete permission that is currently assigned to users');
    }

    return;
  }

  private validateRequiredFields(dto: CreatePermissionDto): void {
    const requiredFields = ['resource', 'actions'];

    for (const field of requiredFields) {
      if (!dto[field]) {
        throw new BadRequestException(`${field} is required`);
      }
    }
  }

  private validateFieldFormats(dto: CreatePermissionDto): void {
    this.validateResourceFormat(dto.resource);
    this.validateActions(dto.actions);
  }

  private validateResourceFormat(resource: string): void {
    if (typeof resource !== 'string') {
      throw new BadRequestException('resource must be a string');
    }

    if (resource.trim().length === 0) {
      throw new BadRequestException('resource cannot be empty');
    }

    if (resource.length > 255) {
      throw new BadRequestException('resource cannot exceed 255 characters');
    }

    const resourceRegex = /^[a-z0-9_-]+$/;
    if (!resourceRegex.test(resource.toLowerCase())) {
      throw new BadRequestException(
        'resource must contain only lowercase letters, numbers, underscores, and hyphens',
      );
    }
  }

  private validateActions(actions: any): void {
    if (!Array.isArray(actions)) {
      throw new BadRequestException('actions must be an array');
    }

    if (actions.length === 0) {
      throw new BadRequestException('actions array cannot be empty');
    }

    const validActions = ['create', 'read', 'update', 'delete'];

    for (const action of actions) {
      if (typeof action !== 'string') {
        throw new BadRequestException('each action must be a string');
      }

      if (!validActions.includes(action.toLowerCase())) {
        throw new BadRequestException(
          `invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`,
        );
      }
    }

    const uniqueActions = new Set(actions.map((a) => a.toLowerCase()));
    if (uniqueActions.size !== actions.length) {
      throw new BadRequestException('actions array contains duplicates');
    }
  }

  private async checkPermissionExists(id: number): Promise<Permission> {
    const permission = await this.permissionRepo.findOne({
      where: { id },
    });

    if (!permission) {
      throw new BadRequestException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  private async checkDuplicateResource(resource: string): Promise<void> {
    const existingPermission = await this.permissionRepo.findOne({
      where: { resource: resource.toLowerCase() },
    });

    if (existingPermission) {
      throw new ConflictException(`Permission with resource "${resource}" already exists`);
    }
  }

  private async checkDuplicateResourceExcludingId(resource: string, id: number): Promise<void> {
    const existingPermission = await this.permissionRepo.findOne({
      where: { resource: resource.toLowerCase() },
    });

    if (existingPermission && existingPermission.id !== id) {
      throw new ConflictException(`Permission with resource "${resource}" already exists`);
    }
  }

  private async isPermissionInUse(): Promise<boolean> {
    // Check if this permission is assigned to any user role
    // This depends on your schema - adjust as needed
    // Example: check user_role_permissions table
    return false; // Placeholder
  }

  validatePaginationQuery(query: any): void {
    if (query.page && query.page < 1) {
      throw new BadRequestException('page must be greater than 0');
    }

    if (query.limit && query.limit < 1) {
      throw new BadRequestException('limit must be greater than 0');
    }

    if (query.limit && query.limit > 100) {
      throw new BadRequestException('limit cannot exceed 100');
    }
  }

  validateSearchQuery(searchQuery: string): void {
    if (searchQuery && searchQuery.length > 255) {
      throw new BadRequestException('search query cannot exceed 255 characters');
    }
  }

  isValidAction(action: string): action is PermissionsEnum {
    return VALID_ACTIONS.includes(toLowerCase(action) as PermissionsEnum);
  }
}
