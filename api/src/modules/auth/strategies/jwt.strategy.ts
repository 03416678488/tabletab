import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import jwtConfig from '../config/jwt.config';
import { AuthJwtPayload, TenantClaim } from '../types/auth-jwtPayload';
import { User } from '@modules/user/entities/users.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { RolePermission } from '@modules/role-permission/entities/role-permission.entity';

/** Role names that bypass permission checks (they administer the system). */
const SUPER_ROLES = ['Owner'];

/** Shape of `req.user` after authentication (used by PermissionGuard + controllers). */
export interface AuthenticatedUser {
  id: string;
  isActive: boolean;
  isDeleted: boolean;
  roleNames: string[];
  isSuperAdmin: boolean;
  /** roles[roleName][resource] = actions[] — the effective role-scoped grants. */
  roles: Record<string, Record<string, string[]>>;
  /** Tenant the token is bound to (null for tenant-less/platform tokens). */
  tenant: TenantClaim | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRolePermissions)
    private readonly userRolesRepository: Repository<UserRolePermissions>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfiguration.secret as string,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(
    req: TenantRequest,
    payload: AuthJwtPayload & { iat?: number },
  ): Promise<AuthenticatedUser> {
    // Tenant-bound token → validate the user and load grants from the tenant's
    // DB (the middleware set req.tenantDataSource from the verified claim).
    const ds = req.tenantDataSource;
    const userRepo = ds ? ds.getRepository(User) : this.userRepository;
    const userRolesRepo = ds
      ? ds.getRepository(UserRolePermissions)
      : this.userRolesRepository;
    const rolePermRepo = ds
      ? ds.getRepository(RolePermission)
      : this.rolePermissionRepository;

    const user = await userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.isActive',
        'user.isDeleted',
        'user.passwordChangedAt',
      ])
      .where('user.id = :userId', { userId: payload.id })
      .getOne();

    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedException();
    }

    // Tokens minted before the last password change are dead — a stolen
    // session must not survive a password reset. (1s slack: iat has second
    // precision while passwordChangedAt has millisecond precision.)
    if (
      user.passwordChangedAt &&
      payload.iat &&
      payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000
    ) {
      throw new UnauthorizedException('Session expired — please sign in again');
    }

    // Attach role-scoped grants freshly each request so permission edits apply
    // immediately. Best-effort: never let this block authentication.
    let roleNames: string[] = [];
    let roles: AuthenticatedUser['roles'] = {};
    try {
      const links = await userRolesRepo.find({
        where: { userId: user.id },
        relations: ['role'],
      });
      const roleIds = [...new Set(links.map((l) => l.roleId))];
      roleNames = [...new Set(links.map((l) => l.role?.name).filter(Boolean))];

      if (roleIds.length) {
        const grants = await rolePermRepo.find({
          where: { roleId: In(roleIds) },
          relations: ['role'],
        });
        for (const g of grants) {
          const name = g.role?.name ?? String(g.roleId);
          roles[name] ??= {};
          roles[name][g.resource] = g.actions;
        }
      }
    } catch {
      roleNames = [];
      roles = {};
    }

    const isSuperAdmin = roleNames.some((n) => SUPER_ROLES.includes(n));

    return {
      id: user.id,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      roleNames,
      isSuperAdmin,
      roles,
      tenant: payload.tenant ?? null,
    };
  }
}
