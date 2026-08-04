import { FormattedRoles } from './types';

export interface AuthJwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: FormattedRoles;
}
