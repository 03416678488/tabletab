import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { RolePermission } from '@modules/role-permission/entities/role-permission.entity';
import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

import { PERMISSIONS_SEED, MODULE_RESOURCES } from './permissions.seed';
import { ROLES_SEED } from './roles.seed';
import { BRANCHES_SEED } from './branches.seed';
import { USERS_SEED } from './users.seed';
import { ROLE_PERMISSIONS_SEED } from './role-permissions.seed';
import { CodeAttemptLog } from '@modules/user/entities/code-attempt-log.entity';
import { User } from '@modules/user/entities/users.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'tabletap-postgres',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USER || 'tabletap_user',
  password: process.env.POSTGRES_PASSWORD || 'secret',
  database: process.env.POSTGRES_DATABASE || 'tabletap_db',
  entities: [
    User,
    Role,
    Permission,
    UserRolePermissions,
    RolePermission,
    CodeAttemptLog,
    Branch,
  ],
  synchronize: false,
});

function getPermissionKey(
  resource: string,
  actions: PermissionsEnum[],
): string {
  return `${resource}:${[...actions].sort().join(',')}`;
}

function actionsMatch(a: PermissionsEnum[], b: PermissionsEnum[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

async function seed() {
  let isConnected = false;

  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${process.env.POSTGRES_HOST || 'tabletap-postgres'}`);
    console.log(`   Port: ${process.env.POSTGRES_PORT || 5435}`);
    console.log(
      `   Database: ${process.env.POSTGRES_DATABASE || 'tabletap_db'}`,
    );

    await AppDataSource.initialize();
    isConnected = true;
    console.log('📦 Database connected\n');

    const permissionRepo = AppDataSource.getRepository(Permission);
    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);
    const userRolePermissionsRepo =
      AppDataSource.getRepository(UserRolePermissions);
    const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

    // Seed Permissions
    console.log('🔐 Seeding permissions...');
    const permissionsMap = new Map<string, Permission>();

    for (const permData of PERMISSIONS_SEED) {
      const key = getPermissionKey(permData.resource, permData.actions);

      const existingPerms = await permissionRepo.find({
        where: { resource: permData.resource },
      });

      const existingPerm = existingPerms.find((p) =>
        actionsMatch(p.actions, permData.actions),
      );

      if (!existingPerm) {
        const permission = permissionRepo.create({
          resource: permData.resource,
          actions: permData.actions,
        });
        const saved = await permissionRepo.save(permission);
        permissionsMap.set(key, saved);
        console.log(
          `  ✅ Created: ${permData.resource} [${permData.actions.join(', ')}]`,
        );
      } else {
        permissionsMap.set(key, existingPerm);
        console.log(
          `  ⏭️  Exists: ${permData.resource} [${permData.actions.join(', ')}]`,
        );
      }
    }

    // Seed Roles
    console.log('\n👔 Seeding roles...');
    const rolesMap = new Map<string, Role>();

    for (const roleData of ROLES_SEED) {
      const existingRole = await roleRepo.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = roleRepo.create(roleData);
        const saved = await roleRepo.save(role);
        rolesMap.set(roleData.name, saved);
        console.log(`  ✅ Created: ${roleData.name}`);
      } else {
        rolesMap.set(roleData.name, existingRole);
        console.log(`  ⏭️  Exists: ${roleData.name}`);
      }
    }

    // Seed role-scoped module permissions (the source of truth for enforcement).
    console.log('\n🧩 Seeding role permissions (modules)...');
    const moduleSet = new Set(MODULE_RESOURCES);
    for (const [roleName, mappings] of Object.entries(ROLE_PERMISSIONS_SEED)) {
      const role = rolesMap.get(roleName);
      if (!role) continue;
      for (const mapping of mappings) {
        if (!moduleSet.has(mapping.resource)) continue; // skip the `app` anchor
        const existing = await rolePermissionRepo.findOne({
          where: { roleId: role.id, resource: mapping.resource },
        });
        if (existing) {
          existing.actions = mapping.actions;
          await rolePermissionRepo.save(existing);
        } else {
          await rolePermissionRepo.save(
            rolePermissionRepo.create({
              roleId: role.id,
              resource: mapping.resource,
              actions: mapping.actions,
            }),
          );
        }
      }
      console.log(`  ✅ ${roleName}: ${mappings.length - 1} module(s)`);
    }

    // Seed Branches (needed before users so staff can be assigned a home branch)
    console.log('\n🏢 Seeding branches...');
    const branchRepo = AppDataSource.getRepository(Branch);
    const branchesMap = new Map<string, string>();
    for (const branchData of BRANCHES_SEED) {
      let branch = await branchRepo.findOne({
        where: { name: branchData.name },
      });
      if (!branch) {
        branch = await branchRepo.save(branchRepo.create(branchData));
        console.log(`  ✅ Created: ${branchData.name}`);
      } else {
        console.log(`  ⏭️  Exists: ${branchData.name}`);
      }
      branchesMap.set(branchData.name, branch.id);
    }

    // Seed Users
    console.log('\n👤 Seeding users...');

    for (const userData of USERS_SEED) {
      // Single-branch staff get a home branch; Owner/Multi-branch/Customer don't.
      const wantBranchId = userData.branch
        ? (branchesMap.get(userData.branch) ?? null)
        : null;

      let user = await userRepo.findOne({
        where: { email: userData.email },
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        user = userRepo.create({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          phoneNumber: userData.phoneNumber,
          emailVerified: userData.emailVerified,
          isActive: userData.isActive,
          branchId: wantBranchId,
        });

        user = await userRepo.save(user);
        console.log(
          `  ✅ Created: ${userData.email}${wantBranchId ? ` (→ ${userData.branch})` : ''}`,
        );
      } else {
        // Backfill the home branch on staff seeded before branch assignment existed.
        if (wantBranchId && user.branchId !== wantBranchId) {
          user.branchId = wantBranchId;
          user = await userRepo.save(user);
          console.log(`  🔗 Assigned ${userData.branch} to ${userData.email}`);
        } else {
          console.log(`  ⏭️  Exists: ${userData.email}`);
        }
      }

      // Assign role and permissions
      const role = rolesMap.get(userData.role);

      if (!role) {
        console.log(`  ⚠️  Role not found: ${userData.role}`);
        continue;
      }

      const rolePermissions = ROLE_PERMISSIONS_SEED[userData.role] || [];

      for (const permMapping of rolePermissions) {
        const key = getPermissionKey(permMapping.resource, permMapping.actions);
        const permission = permissionsMap.get(key);

        if (!permission) {
          console.log(
            `  ⚠️  Permission not found: ${permMapping.resource} [${permMapping.actions.join(', ')}]`,
          );
          continue;
        }

        const existingMapping = await userRolePermissionsRepo.findOne({
          where: {
            userId: user.id,
            roleId: role.id,
            permissionId: permission.id,
          },
        });

        if (!existingMapping) {
          await userRolePermissionsRepo.save({
            userId: user.id,
            roleId: role.id,
            permissionId: permission.id,
          });
          console.log(
            `    🔗 Assigned: ${role.name} -> ${permMapping.resource} [${permMapping.actions.join(', ')}]`,
          );
        } else {
          console.log(
            `    ⏭️  Mapping exists: ${role.name} -> ${permMapping.resource}`,
          );
        }
      }
    }

    console.log('\n✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message || error);
  } finally {
    if (isConnected) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  }
}

seed();
