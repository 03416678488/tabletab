/**
 * Seed branches so every branch-scoped employee can be assigned to a real
 * location. Idempotent — matched by unique `name`.
 */
export const BRANCHES_SEED = [
  {
    name: 'Renala Branch',
    address: 'Main Bazaar Road, Renala Khurd',
    city: 'Renala',
    phone: '+1234500001',
  },
  {
    name: 'Lahore Branch',
    address: 'MM Alam Road, Gulberg III',
    city: 'Lahore',
    phone: '+1234500002',
  },
];

/** Branch (by name) that single-branch seed staff are assigned to by default. */
export const DEFAULT_STAFF_BRANCH = 'Renala Branch';
