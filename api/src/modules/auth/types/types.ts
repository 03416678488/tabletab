export interface BaseUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  geysers?: any;
  roles?: FormattedRoles;
}

export type RegistrationResponse = BaseUserResponse;

export interface LoginResponse extends BaseUserResponse {
  tokens: {
    token: string;
    refreshToken: string;
  };
}

export interface RefreshTokenResponse {
  tokens: {
    token: string;
    refreshToken: string;
  };
}

export interface PasswordResetResponse {
  message: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
}

export interface RefreshToken {
  userId: string;
  refreshToken: string;
}

export interface JwtTokenPair {
  token: string;
  refreshToken: string;
}

export interface ResetToken {
  plainToken: string;
  hashedToken: string;
  expiry: Date;
}

export type FormattedRoles = Record<string, Record<string, string[]>>;
export type FormattedGeyser = Record<string, Record<string, string[]>>;

export interface RolePermission {
  resource: string;
  actions: string[];
}

export interface ValidateUserRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  user: BaseUserResponse;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface UserPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles?: FormattedRoles;
}

export interface CreateUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
