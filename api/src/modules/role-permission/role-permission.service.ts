import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ErrorProvider } from '@modules/common/error/error.provider';
import { Role } from '@modules/role/entities/role.entity';
import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

import { TransactionService } from '@services/transaction.service';
import { RolePermission } from './entities/role-permission.entity';
import {
  ALL_ACTIONS,
  MANAGED_ROLES,
  MODULES,
  MODULE_KEYS,
} from './constants/access-catalog';

export interface AccessMatrix {
  roles: { id: number; name: string }[];
  modules: { key: string; label: string; group: string }[];
  actions: PermissionsEnum[];
  /** grants[roleId][resource] = actions[] */
  grants: Record<number, Record<string, PermissionsEnum[]>>;
}

export interface MyAccess {
  isSuperAdmin: boolean;
  /** grants[resource] = actions[] — the current user's effective permissions. */
  grants: Record<string, string[]>;
}

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly _repo: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly _roleRepo: Repository<Role>,
    private readonly _errors: ErrorProvider,
    private readonly _transactionService: TransactionService,
  ) {}

  /** Everything the permissions UI needs in one call. */
  async getMatrix(): Promise<AccessMatrix> {
    const roles = await this._roleRepo.find({
      where: { name: In([...MANAGED_ROLES]) },
      order: { id: 'ASC' },
    });
    const roleIds = roles.map((r) => r.id);

    const rows = roleIds.length
      ? await this._repo.find({ where: { roleId: In(roleIds) } })
      : [];

    const grants: AccessMatrix['grants'] = {};
    for (const r of roles) grants[r.id] = {};
    for (const row of rows) {
      if (!grants[row.roleId]) grants[row.roleId] = {};
      grants[row.roleId][row.resource] = row.actions;
    }

    // Order roles to match the managed list.
    const ordered = [...roles].sort(
      (a, b) =>
        MANAGED_ROLES.indexOf(a.name as (typeof MANAGED_ROLES)[number]) -
        MANAGED_ROLES.indexOf(b.name as (typeof MANAGED_ROLES)[number]),
    );

    return {
      roles: ordered.map((r) => ({ id: r.id, name: r.name })),
      modules: MODULES,
      actions: ALL_ACTIONS,
      grants,
    };
  }

  /** Collapse a user's role-scoped grants into one effective permission map. */
  buildMyAccess(
    roles: Record<string, Record<string, string[]>>,
    isSuperAdmin: boolean,
  ): MyAccess {
    if (isSuperAdmin) return { isSuperAdmin: true, grants: {} };

    const grants: Record<string, string[]> = {};
    for (const perResource of Object.values(roles ?? {})) {
      for (const [resource, actions] of Object.entries(perResource)) {
        const set = new Set(grants[resource] ?? []);
        for (const a of actions) set.add(a);
        grants[resource] = Array.from(set);
      }
    }
    return { isSuperAdmin: false, grants };
  }

  /** Replace a role's full grant set. Unknown modules/actions are dropped. */
  async updateRoleGrants(
    roleId: number,
    grants: Record<string, string[]>,
  ): Promise<Record<string, PermissionsEnum[]>> {
    const role = await this._roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      this._errors.add('roleId', 'Role not found');
      this._errors.throwNotFoundErrorIfExists();
    }

    const sanitized = this.sanitize(grants);

    const rows = Object.entries(sanitized)
      .filter(([, actions]) => actions.length > 0)
      .map(([resource, actions]) =>
        this._repo.create({ roleId, resource, actions }),
      );

    // Atomic: clear the role's old grants and write the new set together — a
    // partial replace would leave the role with a broken permission set.
    await this._transactionService.execute(async (queryRunner) => {
      await queryRunner.manager.delete(RolePermission, { roleId });
      if (rows.length) await queryRunner.manager.save(RolePermission, rows);
    });

    return sanitized;
  }

  /** Keep only known modules + known actions (de-duplicated). */
  private sanitize(
    grants: Record<string, string[]>,
  ): Record<string, PermissionsEnum[]> {
    const validActions = new Set<string>(ALL_ACTIONS);
    const out: Record<string, PermissionsEnum[]> = {};
    for (const key of MODULE_KEYS) {
      const raw = grants[key];
      if (!Array.isArray(raw)) continue;
      const actions = Array.from(
        new Set(raw.filter((a) => validActions.has(a))),
      ) as PermissionsEnum[];
      if (actions.length) out[key] = actions;
    }
    return out;
  }
}
