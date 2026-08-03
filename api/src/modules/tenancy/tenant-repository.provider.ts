import { Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';

import { TenantRequest } from './tenancy.types';

/** The entity form `getRepositoryToken` accepts (class or EntitySchema). */
type EntityRef = Parameters<typeof getRepositoryToken>[0];

/**
 * A request-scoped repository bound to the *resolved tenant's* database.
 *
 * It reuses the standard `getRepositoryToken(entity)` token, so it transparently
 * overrides the default repository within the module that registers it —
 * meaning existing services keep using `@InjectRepository(Entity)` unchanged and
 * automatically talk to the current tenant's DB. When no tenant is resolved
 * (single-tenant / dev / unmatched host), it falls back to the default DataSource.
 *
 * Registering one of these makes the consuming services request-scoped; keep the
 * set of tenant-aware entities scoped to the module that needs them.
 */
export function tenantRepositoryProvider(entity: EntityRef): Provider {
  return {
    provide: getRepositoryToken(entity),
    scope: Scope.REQUEST,
    inject: [REQUEST, getDataSourceToken()],
    useFactory: (req: TenantRequest, fallback: DataSource) =>
      (req.tenantDataSource ?? fallback).getRepository(entity as EntityTarget<ObjectLiteral>),
  };
}
