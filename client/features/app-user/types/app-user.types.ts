export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roleName: string | null;
  branchId: string | null;
  createdAt: string;
}

export interface ListUsersParams {
  role?: string;
  search?: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleName?: string;
  branchId?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  branchId?: string | null;
  isActive?: boolean;
}
