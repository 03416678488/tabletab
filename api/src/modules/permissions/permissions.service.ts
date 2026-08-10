import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { GetPermissionQueryDto } from './dto/get-permission-query.dto';
import { PermissionsValidatorService } from './services/permission-validator.service';
import { toLowerCase } from '@cor/helpers';
import { PermissionsEnum } from './enums/permissions.enum';
import { TransactionService } from '@services/transaction.service';

@Injectable()
export class PermissionsService extends AbstractService<Permission> {
  constructor(
    @InjectRepository(Permission)
    protected readonly permissionRepo: Repository<Permission>,
    protected readonly paginationProvider: PaginationProvider,
    private readonly validatorService: PermissionsValidatorService,
    private readonly transactionService: TransactionService,
  ) {
    super(permissionRepo, paginationProvider);
  }

  async getAll(dto: GetPermissionQueryDto) {
    this.validatorService.validatePaginationQuery(dto);
    return await this.paginate(dto);
  }

  async getPermissionById(id: number): Promise<Permission> {
    const permission = await this.permissionRepo.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission not found`);
    }

    return permission;
  }

  async getPermissionByResource(resource: string): Promise<Permission> {
    const permission = await this.permissionRepo.findOne({
      where: { resource: toLowerCase(resource) },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with resource "${resource}" not found`,
      );
    }

    return permission;
  }

  async getPermissionsByIds(ids: number[]): Promise<Permission[]> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('IDs array cannot be empty');
    }

    const permissions = await this.permissionRepo.findByIds(ids);

    if (permissions.length !== ids.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    return permissions;
  }

  async searchPermissions(searchQuery: string): Promise<Permission[]> {
    if (!searchQuery) {
      throw new BadRequestException('Search query is required');
    }

    this.validatorService.validateSearchQuery(searchQuery);

    return await this.permissionRepo
      .createQueryBuilder('permission')
      .where('permission.resource ILIKE :query', {
        query: `%${searchQuery}%`,
      })
      .orderBy('permission.resource', 'ASC')
      .getMany();
  }

  async createPermission(
    permissionData: CreatePermissionDto,
  ): Promise<Permission> {
    try {
      await this.validatorService.validateCreatePermission(permissionData);

      const normalizedData = {
        ...permissionData,
        resource: toLowerCase(permissionData.resource),
      };

      const permission = this.permissionRepo.create(normalizedData);
      const savedPermission = await this.permissionRepo.save(permission);

      return savedPermission;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create permission: ${error.message}`,
      );
    }
  }

  async createBulkPermissions(
    permissionsData: CreatePermissionDto[],
  ): Promise<Permission[]> {
    if (!permissionsData || permissionsData.length === 0) {
      throw new BadRequestException('Permissions array cannot be empty');
    }

    for (const data of permissionsData) {
      await this.validatorService.validateCreatePermission(data);
    }

    const normalizedData = permissionsData.map((data) => ({
      ...data,
      resource: toLowerCase(data.resource),
    }));

    const permissions = this.permissionRepo.create(normalizedData);
    return await this.permissionRepo.save(permissions);
  }

  async updatePermission(
    id: number,
    updateData: UpdatePermissionDto,
  ): Promise<Permission> {
    try {
      await this.validatorService.validateUpdatePermission(id, updateData);

      const normalizedData = {
        ...updateData,
        ...(updateData.resource && {
          resource: toLowerCase(updateData.resource),
        }),
      };

      await this.permissionRepo.update(id, normalizedData);

      return await this.getPermissionById(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update permission: ${error.message}`,
      );
    }
  }

  async updateBulkPermissions(
    updates: Array<{ id: number; data: UpdatePermissionDto }>,
  ): Promise<Permission[]> {
    if (!updates || updates.length === 0) {
      throw new BadRequestException('Updates array cannot be empty');
    }

    for (const { id, data } of updates) {
      await this.validatorService.validateUpdatePermission(id, data);
    }

    // Atomic: apply every permission update together, or none — a partial bulk
    // update would leave the permission set inconsistent.
    await this.transactionService.execute(async (queryRunner) => {
      for (const { id, data } of updates) {
        const normalizedData = {
          ...data,
          ...(data.resource && {
            resource: toLowerCase(data.resource),
          }),
        };
        await queryRunner.manager.update(Permission, id, normalizedData);
      }
    });

    const updatedPermissions: Permission[] = [];
    for (const { id } of updates) {
      updatedPermissions.push(await this.getPermissionById(id));
    }

    return updatedPermissions;
  }

  async addActionToPermission(id: number, action: string): Promise<Permission> {
    const permission = await this.getPermissionById(id);

    if (!this.validatorService.isValidAction(action)) {
      throw new BadRequestException('Invalid action');
    }

    const actionLower = toLowerCase(action) as PermissionsEnum;

    if (
      permission.actions.some(
        (a) => toLowerCase(a) === toLowerCase(actionLower),
      )
    ) {
      throw new ConflictException('Action already exists');
    }

    permission.actions.push(actionLower);

    await this.permissionRepo.save(permission);
    return permission;
  }

  async removeActionFromPermission(
    id: number,
    action: string,
  ): Promise<Permission> {
    const permission = await this.getPermissionById(id);

    const actionIndex = permission.actions.findIndex(
      (a) => toLowerCase(a) === toLowerCase(action),
    );

    if (actionIndex === -1) {
      throw new NotFoundException(
        `Action "${action}" not found for this permission`,
      );
    }

    if (permission.actions.length === 1) {
      throw new BadRequestException(
        'Cannot remove the only action from a permission',
      );
    }

    permission.actions.splice(actionIndex, 1);

    await this.permissionRepo.save(permission);
    return permission;
  }

  async deletePermission(id: number): Promise<void> {
    try {
      await this.validatorService.validateDelete();

      const result = await this.permissionRepo.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete permission: ${error.message}`,
      );
    }
  }

  async deleteBulkPermissions(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('IDs array cannot be empty');
    }

    // for (const id of ids) {
    //   await this.validatorService.validateDelete();
    // }

    const result = await this.permissionRepo.delete(ids);

    if (result.affected !== ids.length) {
      throw new NotFoundException('One or more permissions not found');
    }
  }

  async deleteAllPermissions(): Promise<void> {
    const result = await this.permissionRepo.delete({});
    console.warn(`Deleted ${result.affected} permissions`);
  }

  async permissionExists(id: number): Promise<boolean> {
    return await this.permissionRepo.exists({ where: { id } });
  }

  async getPermissionCount(): Promise<number> {
    return await this.permissionRepo.count();
  }

  async getAllResources(): Promise<string[]> {
    const permissions = await this.permissionRepo
      .createQueryBuilder('permission')
      .select('DISTINCT permission.resource', 'resource')
      .orderBy('permission.resource', 'ASC')
      .getRawMany();

    return permissions.map((p) => p.resource);
  }

  getAllValidActions(): string[] {
    return ['create', 'read', 'update', 'delete'];
  }

  async exportPermissions(): Promise<Permission[]> {
    return await this.permissionRepo.find({
      order: {
        resource: 'ASC',
      },
    });
  }

  async importPermissions(
    permissions: CreatePermissionDto[],
  ): Promise<Permission[]> {
    return await this.createBulkPermissions(permissions);
  }
}
