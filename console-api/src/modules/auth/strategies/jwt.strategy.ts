import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import jwtConfig from '../config/jwt.config';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import { User } from '@modules/user/entities/users.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { RolePermission } from '@modules/role-permission/entities/role-permission.entity';

/** Role names that bypass permission checks (they administer the system). */
const SUPER_ROLES = ['Super Admin', 'Admin', 'Administrators'];

/** Shape of `req.user` after authentication (used by RolesGuard + controllers). */
export interface AuthenticatedUser {
  id: string;
  email: string;
  isActive: boolean;
  isDeleted: boolean;
  roleNames: string[];
  isSuperAdmin: boolean;
  /** roles[roleName][resource] = actions[] — the effective role-scoped grants. */
  roles: Record<string, Record<string, string[]>>;
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
      secretOrKey: jwtConfiguration.secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: AuthJwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.isActive', 'user.isDeleted'])
      .where('user.id = :userId', { userId: payload.id })
      .getOne();

    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedException();
    }

    // Attach role-scoped grants freshly each request so permission edits apply
    // immediately. Best-effort: never let this block authentication.
    let roleNames: string[] = [];
    let roles: AuthenticatedUser['roles'] = {};
    try {
      const links = await this.userRolesRepository.find({
        where: { userId: user.id },
        relations: ['role'],
      });
      const roleIds = [...new Set(links.map((l) => l.roleId))];
      roleNames = [...new Set(links.map((l) => l.role?.name).filter(Boolean))];

      if (roleIds.length) {
        const grants = await this.rolePermissionRepository.find({
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
      email: payload.email,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      roleNames,
      isSuperAdmin,
      roles,
    };
  }
}
