import { DataSource, Repository, QueryRunner } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcryptjs';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { TransactionService } from '@services/transaction.service';

import { CreateUserDto } from './dto/create-user.dto';

import { User } from 'src/modules/user/entities/users.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { Role } from '@modules/role/entities/role.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';

import { AUTH_CONSTANTS } from '@modules/auth/constants';

@Injectable()
export class UserService extends AbstractService<User> {
  constructor(
    @InjectRepository(User)
    private readonly _userRepo: Repository<User>,
    @InjectRepository(UserRolePermissions)
    private readonly _userRolePermissionsRepo: Repository<UserRolePermissions>,
    @InjectRepository(Role)
    private readonly _roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly _permissionRepo: Repository<Permission>,
    private readonly _transactionService: TransactionService,
  ) {
    super(_userRepo);
  }

  /**
   * Create a user (+ default role). When `dataSource` is a tenant connection the
   * whole transaction — user row and role assignment — runs in that tenant's DB.
   */
  async createUser(
    dto: CreateUserDto,
    roleName: string = 'User',
    dataSource?: DataSource,
  ): Promise<User> {
    const build = async (queryRunner: QueryRunner): Promise<string> => {
      const hashedPassword = await bcrypt.hash(dto.password, AUTH_CONSTANTS.SALT_ROUNDS);
      const user = this._userRepo.create({
        ...dto,
        password: hashedPassword,
        emailVerified: false,
      });
      const savedUser = await queryRunner.manager.save(User, user);
      await this.assignRoleToUser(queryRunner, savedUser.id, roleName, dataSource);
      return savedUser.id;
    };

    let userId: string;
    if (dataSource) {
      const qr = dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        userId = await build(qr);
        await qr.commitTransaction();
      } catch (err) {
        await qr.rollbackTransaction();
        throw err;
      } finally {
        await qr.release();
      }
    } else {
      userId = await this._transactionService.execute(build);
    }

    return this.findOneWithRoles(userId, dataSource?.getRepository(User));
  }

  /** `repo` overrides the default connection — pass a tenant's User repo to
   *  authenticate against that tenant's database. */
  async attemptLogin(email: string, repo?: Repository<User>) {
    return (repo ?? this._userRepo)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRolePermissions', 'userRolePermissions')
      .leftJoinAndSelect('userRolePermissions.role', 'role')
      .leftJoinAndSelect('userRolePermissions.permission', 'permission')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByEmail(email: string, repo?: Repository<User>): Promise<User | null> {
    return (repo ?? this._userRepo).findOne({
      where: { email },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phoneNumber',
        'password',
        'resetToken',
        'resetTokenExpiry',
        'resetCodeAttempts',
        'resetCodeLastAttemptAt',
        'resetCodeLockedUntil',
        'resetCodeDeliveredVia',
        'resetCodeSentAt',
        'emailVerified',
        'verificationToken',
        'verificationTokenExpiry',
        'verificationCodeAttempts',
        'verificationCodeLastAttemptAt',
        'verificationCodeLockedUntil',
        'verificationCodeDeliveredVia',
        'verificationCodeSentAt',
        'isActive',
        'isDeleted',
        'deletedAt',
        'lastLoginAt',
        'passwordChangedAt',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  /** True if a user with this phone already exists (in the given/default DB). */
  async existsByPhone(phoneNumber: string, repo?: Repository<User>): Promise<boolean> {
    const found = await (repo ?? this._userRepo).findOne({
      where: { phoneNumber },
      select: ['id'],
    });
    return Boolean(found);
  }

  /** List users (optionally scoped to a role) with their role name. Powers the Users screens. */
  async listUsers(params: { role?: string; search?: string }): Promise<
    {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      isActive: boolean;
      roleName: string | null;
      createdAt: Date;
    }[]
  > {
    const qb = this._userRepo
      .createQueryBuilder('u')
      .leftJoin('u.userRolePermissions', 'urp')
      .leftJoin('urp.role', 'r')
      .where('u.isDeleted = :deleted', { deleted: false })
      .select([
        'u.id AS id',
        'u.firstName AS "firstName"',
        'u.lastName AS "lastName"',
        'u.email AS email',
        'u.phoneNumber AS phone',
        'u.isActive AS "isActive"',
        'u.createdAt AS "createdAt"',
        'r.name AS "roleName"',
      ])
      .distinct(true)
      .orderBy('u.createdAt', 'DESC');

    if (params.role) qb.andWhere('r.name = :role', { role: params.role });
    if (params.search) {
      qb.andWhere(
        '(u.firstName ILIKE :s OR u.lastName ILIKE :s OR u.email ILIKE :s)',
        { s: `%${params.search}%` },
      );
    }

    return qb.getRawMany();
  }

  async findById(id: string, select?: string[], repo?: Repository<User>): Promise<User | null> {
    const r = repo ?? this._userRepo;
    if (select) {
      return r.findOne({
        where: { id },
        select: select as any,
      });
    }
    return r.findOne({ where: { id } });
  }

  async findOneWithRoles(id: string, repo?: Repository<User>): Promise<User> {
    const user = await (repo ?? this._userRepo).findOne({
      where: { id },
      relations: [
        'userRolePermissions',
        'userRolePermissions.role',
        'userRolePermissions.permission',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async getCurrentUser(user: User): Promise<User> {
    return this.findById(user.id, [
      'id',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'emailVerified',
      'createdAt',
      'updatedAt',
    ]) as Promise<User>;
  }

  async updateResetToken(
    userId: string,
    resetToken: string,
    resetTokenExpiry: Date,
    repo?: Repository<User>,
  ): Promise<void> {
    await (repo ?? this._userRepo).update(
      { id: userId },
      {
        resetToken,
        resetTokenExpiry,
      },
    );
  }

  async findByVerificationToken(plainToken: string): Promise<User | null> {
    const allUsers = await this._userRepo.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'verificationToken',
        'verificationTokenExpiry',
        'emailVerified',
      ],
    });

    for (const user of allUsers) {
      if (user.verificationToken) {
        try {
          const isMatch = await bcrypt.compare(plainToken, user.verificationToken);
          if (isMatch) {
            return user;
          }
        } catch (error) {
          console.log(error);
          continue;
        }
      }
    }

    return null;
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const user = await this._userRepo.findOne({
      where: { email },
      select: ['emailVerified'],
    });
    return user?.emailVerified || false;
  }

  async clearResetToken(userId: string, repo?: Repository<User>): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      resetToken: null,
      resetTokenExpiry: null,
    });
  }

  async updatePassword(
    userId: string,
    hashedPassword: string,
    repo?: Repository<User>,
  ): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      password: hashedPassword,
    });
  }

  async updatePasswordChangedAt(userId: string, repo?: Repository<User>): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      passwordChangedAt: new Date(),
    });
  }

  async setVerificationToken(
    userId: string,
    token: string,
    expiry: Date,
    repo?: Repository<User>,
  ): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      verificationToken: token,
      verificationTokenExpiry: expiry,
    });
  }

  async clearVerificationToken(userId: string, repo?: Repository<User>): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      verificationToken: null,
      verificationTokenExpiry: null,
    });
  }

  async verifyEmail(userId: string, repo?: Repository<User>): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });
  }

  async updateResetCodeAttempts(
    userId: string,
    attempts: number,
    repo?: Repository<User>,
  ): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      resetCodeAttempts: attempts,
      resetCodeLastAttemptAt: new Date(),
    });
  }

  async updateResetCodeLockedUntil(
    userId: string,
    lockedUntil: Date,
    repo?: Repository<User>,
  ): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      resetCodeLockedUntil: lockedUntil,
    });
  }

  async updateVerificationCodeAttempts(
    userId: string,
    attempts: number,
    repo?: Repository<User>,
  ): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      verificationCodeAttempts: attempts,
      verificationCodeLastAttemptAt: new Date(),
    });
  }

  async updateVerificationCodeLockedUntil(
    userId: string,
    lockedUntil: Date,
    repo?: Repository<User>,
  ): Promise<void> {
    await (repo ?? this._userRepo).update(userId, {
      verificationCodeLockedUntil: lockedUntil,
    });
  }

  async deleteUser(id: number): Promise<void> {
    const result = await this._userRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async softDeleteUser(id: number): Promise<void> {
    await this._userRepo.update(id, { isDeleted: true });
  }

  private async assignRoleToUser(
    queryRunner: QueryRunner,
    userId: string,
    roleName: string,
    dataSource?: DataSource,
  ): Promise<void> {
    const roleRepo = dataSource ? dataSource.getRepository(Role) : this._roleRepo;
    const permissionRepo = dataSource ? dataSource.getRepository(Permission) : this._permissionRepo;

    const role = await roleRepo.findOne({
      where: { name: roleName },
    });

    if (!role) {
      console.warn(`Role '${roleName}' not found`);
      return;
    }

    const permissions = await permissionRepo.find({
      where: { resource: 'users' },
    });

    if (!permissions.length) {
      console.warn('No permissions found for resource "users"');
      return;
    }

    for (const permission of permissions) {
      const userRolePermission = this._userRolePermissionsRepo.create({
        userId,
        roleId: Number(role.id),
        permissionId: Number(permission.id),
      });

      await queryRunner.manager.save(userRolePermission);
    }
  }

  async isUserExistById(id: string): Promise<boolean> {
    return (await this.findOneBy({ id })) !== null;
  }
}
