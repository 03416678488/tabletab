import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Role } from './entities/role.entity';
import { UserRolePermissions } from './entities/user-role-permissions.entity';
import { RoleValidatorService } from './services/role-validator.service';

import { GetRoleQueryDto, CreateRoleDto, AttachRoleToUserDto, UpdateRoleDto } from './dto';

@Injectable()
export class RoleService extends AbstractService<Role> {
  constructor(
    @InjectRepository(Role)
    protected readonly repository: Repository<Role>,
    @InjectRepository(UserRolePermissions)
    private readonly _userRolePermissionsRepo: Repository<UserRolePermissions>,
    private readonly _validatorService: RoleValidatorService,
    protected readonly pagination: PaginationProvider,
  ) {
    super(repository, pagination);
  }

  async getAll(query: GetRoleQueryDto): Promise<Paginated<Role>> {
    return await this.pagination.paginationQuery(query, this.repository);
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    await this._validatorService.validateCreate(dto);
    return this.create(dto);
  }

  async updateRole(id: number, dto: UpdateRoleDto): Promise<Role> {
    await this._validatorService.validateUpdate(id, dto);
    return this.update(id, dto);
  }

  deleteRole(id: number) {
    return this.delete(id);
  }

  async attachToUser(dto: AttachRoleToUserDto): Promise<UserRolePermissions> {
    await this._validatorService.validateAttachToUser(dto);

    await this._userRolePermissionsRepo.upsert(
      {
        userId: dto.userId,
        roleId: dto.roleId,
        permissionId: dto.permissionId,
      },
      ['userId', 'roleId', 'permissionId'],
    );

    return this._userRolePermissionsRepo.findOne({
      where: {
        userId: dto.userId,
        roleId: dto.roleId,
        permissionId: dto.permissionId,
      },
      relations: ['user', 'role', 'permission'],
      select: {
        user: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
        role: {
          id: true,
          name: true,
        },
        permission: {
          id: true,
          resource: true,
          actions: true,
        },
      },
    });
  }

  async detachFromUser(dto: AttachRoleToUserDto): Promise<{ message: string }> {
    await this._userRolePermissionsRepo.delete({
      userId: dto.userId,
      roleId: dto.roleId,
      permissionId: dto.permissionId,
    });

    return { message: 'Role detached from user successfully' };
  }

  async getUserRoles(userId: string): Promise<UserRolePermissions[]> {
    return this._userRolePermissionsRepo.find({
      where: { userId },
      relations: ['role', 'permission'],
    });
  }
}
