import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AttachRoleToUserDto } from '../dto';
import { UserService } from '@modules/user/user.service';
import { PermissionsService } from '@modules/permissions/permissions.service';

@Injectable()
export class RoleValidatorService extends AbstractService<Role> {
  constructor(
    @InjectRepository(Role)
    protected readonly repository: Repository<Role>,
    private readonly _userService: UserService,
    private readonly _permissionService: PermissionsService,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateRoleDto): Promise<void> {
    await this.checkNameExists(dto.name);
  }

  async validateUpdate(id: number, dto: UpdateRoleDto): Promise<void> {
    await this.checkRoleExists(id);

    if (dto.name) {
      await this.checkNameExists(dto.name, id);
    }
  }

  private async checkRoleExists(id: number): Promise<void> {
    const exists = await this.exists({ id } as any);

    if (!exists) {
      this._errors.add('role', 'Role not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  private async checkNameExists(name: string, excludeId?: number): Promise<void> {
    const exists = await this.isRecordExistForCurrentUser('name', name, excludeId);

    if (exists) {
      this._errors.add('name', 'Role name already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }

  async validateAttachToUser(dto: AttachRoleToUserDto): Promise<void> {
    await this.checkUserExists(dto.userId);
    await this.checkRoleExists(dto.roleId);
    // await this._permissionService.getPermissionById(dto.permissionId);
  }

  async checkUserExists(userId: string): Promise<void> {
    const exists = await this._userService.findById(userId);

    if (!exists) {
      this._errors.add('userId', 'User does not exist');
      this._errors.throwNotFoundErrorIfExists();
    }
  }
}
