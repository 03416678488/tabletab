import * as bcrypt from 'bcryptjs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SeedOwnerInput {
  email: string;
  password: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Creates the first **admin** user inside a tenant's own database. Used by both
 * self-serve signup and admin-created tenants so the two paths seed an owner
 * identically. The tenant DB is cloned from a pre-seeded template, so we grant
 * the Admin role by copying that role's existing permission links onto the new
 * user — mirroring a real admin exactly, with no permission mapping duplicated.
 */
@Injectable()
export class OwnerSeedingService {
  private readonly logger = new Logger(OwnerSeedingService.name);

  /** Short-lived connection to a specific tenant database (raw queries only). */
  private tenantDataSource(dbName: string): DataSource {
    return new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: dbName,
    });
  }

  async seedOwner(dbName: string, input: SeedOwnerInput): Promise<void> {
    const ds = this.tenantDataSource(dbName);
    await ds.initialize();
    try {
      // Atomic: either the user and all its role links land, or nothing does.
      await ds.transaction(async (tx) => {
        const existing = await tx.query(
          `SELECT id FROM users WHERE email = $1 LIMIT 1`,
          [input.email],
        );
        if (existing.length) {
          throw new BadRequestException('An account with this email already exists');
        }

        const roleRows = (await tx.query(
          `SELECT id FROM roles WHERE name = 'Admin' LIMIT 1`,
        )) as { id: number }[];
        const adminRoleId = roleRows[0]?.id;
        if (!adminRoleId) {
          throw new Error('Template DB missing the Admin role');
        }

        const hashed = await bcrypt.hash(input.password, 10);
        const [{ id: userId }] = (await tx.query(
          `INSERT INTO users ("firstName", "lastName", email, password, "phoneNumber", "emailVerified", "isActive")
           VALUES ($1, $2, $3, $4, $5, true, true) RETURNING id`,
          [
            input.firstName ?? 'Owner',
            input.lastName ?? '',
            input.email,
            hashed,
            input.phoneNumber ?? '',
          ],
        )) as { id: string }[];

        // Grant Admin by cloning the role's permission links onto the new user.
        await tx.query(
          `INSERT INTO user_role_permissions ("userId", "roleId", "permissionId")
           SELECT DISTINCT $1::uuid, "roleId", "permissionId"
           FROM user_role_permissions WHERE "roleId" = $2`,
          [userId, adminRoleId],
        );

        this.logger.log(
          `Seeded owner ${input.email} in ${dbName} with Admin role (user ${userId})`,
        );
      });
    } finally {
      await ds.destroy();
    }
  }
}
