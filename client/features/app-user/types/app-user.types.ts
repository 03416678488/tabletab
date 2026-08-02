export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roleName: string | null;
  createdAt: string;
}

export interface ListUsersParams {
  role?: string;
  search?: string;
}
