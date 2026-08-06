/** API auth endpoints (relative to NEXT_PUBLIC_API_BASE_URL, e.g. http://localhost:3003/api). */
export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
} as const;

/** Where each area of the app lives. */
export const AUTH_ROUTES = {
  /** The staff/owner login screen. */
  login: "/login",
  /** Default landing after a successful login (all roles, for now). */
  afterLogin: "/owner",
} as const;

/** API role name for the top-level owner portal. */
export const OWNER_ROLE = "Owner" as const;

export const AUTH_MESSAGES = {
  invalidCredentials: "Invalid email or password",
  genericError: "Something went wrong. Please try again.",
} as const;
