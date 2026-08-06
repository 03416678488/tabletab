import { getSession, signOut } from "next-auth/react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export type ApiResponse<T> = {
    _metaData: {
        statusCode: number;
        message: string;
    };
    data: T;
};

export type ApiFieldError = {
    property: string;
    message: string;
};

export class ApiError extends Error {
    statusCode: number;
    fieldErrors: ApiFieldError[];
    payload: unknown;

    constructor(opts: {
        message: string;
        statusCode: number;
        fieldErrors?: ApiFieldError[];
        payload?: unknown;
    }) {
        super(opts.message);
        this.name = "ApiError";
        this.statusCode = opts.statusCode;
        this.fieldErrors = opts.fieldErrors ?? [];
        this.payload = opts.payload;
    }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
    params?: Record<string, string | number | boolean | undefined | null> | string;
    token?: string;
    auth?: boolean;
    headers?: Record<string, string>;
    cache?: RequestCache;
    next?: NextFetchRequestConfig;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Prevent multiple simultaneous redirects
let isRedirectingToLogin = false;

async function handleUnauthorized(): Promise<never> {
    if (isRedirectingToLogin) {
        // Already redirecting — just throw so callers stop execution
        throw new ApiError({
            message: "Session expired",
            statusCode: 401,
        });
    }

    isRedirectingToLogin = true;
    clearSessionTokenCache();

    try {
        // Clear the Next-Auth session so middleware won't restore it
        await signOut({ redirect: false });
    } catch {
        // signOut can fail if session is already gone — that's fine
    }

    const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
    );
    window.location.href = `/login?callbackUrl=${callbackUrl}&reason=session_expired`;

    // This throw is never caught visibly — redirect is already happening
    throw new ApiError({
        message: "Session expired. Redirecting to login...",
        statusCode: 401,
    });
}

// Cache the session token briefly so a burst of authed requests (e.g. a
// dashboard load firing ~10 calls at once) shares ONE `/session` fetch instead
// of one each. The TTL is far shorter than the access token's own lifetime, so
// the cached value is always still valid; a rotated token is picked up on the
// next window. Cleared on 401 for good measure.
let sessionTokenCache: { token?: string; at: number } | null = null;
let sessionTokenInflight: Promise<string | undefined> | null = null;
const SESSION_TOKEN_TTL = 10_000;

function clearSessionTokenCache() {
    sessionTokenCache = null;
    sessionTokenInflight = null;
}

async function getAuthToken(manualToken?: string) {
    if (manualToken) return manualToken;

    const now = Date.now();
    if (sessionTokenCache && now - sessionTokenCache.at < SESSION_TOKEN_TTL) {
        return sessionTokenCache.token;
    }
    // Coalesce concurrent callers onto a single in-flight getSession().
    if (sessionTokenInflight) return sessionTokenInflight;

    sessionTokenInflight = getSession()
        .then((session) => {
            sessionTokenCache = { token: session?.accessToken, at: Date.now() };
            sessionTokenInflight = null;
            return session?.accessToken;
        })
        .catch(() => {
            sessionTokenInflight = null;
            return undefined;
        });
    return sessionTokenInflight;
}

function buildQueryString(params: RequestOptions["params"]): string {
    if (!params) return "";
    if (typeof params === "string") {
        return params.startsWith("?") ? params.slice(1) : params;
    }
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        search.set(key, String(value));
    }
    return search.toString();
}

function extractFieldErrors(payload: any): ApiFieldError[] {
    const candidates = [
        payload?.message,
        payload?.errors,
        payload?._metaData?.message,
        payload?._metaData?.errors,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const fieldErrors = candidate
                .filter(
                    (e) =>
                        e &&
                        typeof e === "object" &&
                        typeof (e.property ?? e.field) === "string" &&
                        typeof e.message === "string"
                )
                .map((e) => ({
                    property: e.property ?? e.field,
                    message: e.message,
                }));
            if (fieldErrors.length > 0) return fieldErrors;
        }
    }

    return [];
}

function extractTopLevelMessage(payload: any): string | null {
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?._metaData?.message === "string") return payload._metaData.message;
    if (typeof payload?.error === "string") return payload.error;
    return null;
}

function buildErrorMessage(fieldErrors: ApiFieldError[], payload: any): string {
    if (fieldErrors.length === 1) return fieldErrors[0].message;
    if (fieldErrors.length > 1) return fieldErrors.map((f) => f.message).join(" • ");
    return extractTopLevelMessage(payload) ?? "Something went wrong";
}

async function request<T>(
    endpoint: string,
    method: HttpMethod,
    body?: unknown,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { params, token, auth = false, headers, cache, next } = options;

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const requestHeaders: Record<string, string> = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
    };

    if (auth) {
        const authToken = await getAuthToken(token);
        if (authToken) {
            requestHeaders.Authorization = `Bearer ${authToken}`;
        }
    }

    const queryString = buildQueryString(params);
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ""}`;

    let requestBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
        requestBody = isFormData ? (body as FormData) : JSON.stringify(body);
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        cache,
        next,
    });

    let result: any = null;
    try {
        result = await response.json();
    } catch {
        result = null;
    }

    if (!response.ok) {
        if (response.status === 401) {
            await handleUnauthorized();
        }

        const fieldErrors = extractFieldErrors(result);
        const message = buildErrorMessage(fieldErrors, result);

        throw new ApiError({
            message,
            statusCode: response.status,
            fieldErrors,
            payload: result,
        });
    }

    return result as ApiResponse<T>;
}

export const httpClient = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, "GET", undefined, options),
    post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, "POST", body, options),
    put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, "PUT", body, options),
    patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, "PATCH", body, options),
    delete: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, "DELETE", undefined, options),
};

export function applyApiErrorToForm<T extends FieldValues>(
    err: unknown,
    setError: UseFormSetError<T>,
    fallbackField: Path<T>,
    knownFields?: Path<T>[]
) {
    if (err instanceof ApiError && err.fieldErrors.length > 0) {
        const unmatched: string[] = [];

        for (const { property, message } of err.fieldErrors) {
            const isKnown = knownFields
                ? (knownFields as string[]).includes(property)
                : true;

            if (isKnown) {
                setError(property as Path<T>, { type: "server", message });
            } else {
                unmatched.push(message);
            }
        }

        if (unmatched.length > 0) {
            setError(fallbackField, {
                type: "server",
                message: unmatched.join(" • "),
            });
        }
        return;
    }

    setError(fallbackField, {
        type: "server",
        message: err instanceof Error ? err.message : "Something went wrong",
    });
}