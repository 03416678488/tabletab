import { ColumnOptions } from 'typeorm';

export const ON_DELETE_SET_NULL = 'SET NULL' as const;
export const COLUMN_NULLABLE = { nullable: true };
export const COLUMN_VARCHAR = { type: 'varchar' };
export const COLUMN_OPTIONAL_STRING: ColumnOptions = {
  type: 'varchar',
  nullable: true,
};
export const RELATION_SET_NULL = {
  onDelete: ON_DELETE_SET_NULL,
  nullable: true,
};

export const COLUMN_JOIN_CONTACT_ID = { name: 'contactId' };

export const TYPE_STRING_OR_NULL_VALUE: string | null = null;

export type TYPE_STRING_OR_NULL = string | null;
export type TYPE_NUMBER_OR_NULL = number | null;
