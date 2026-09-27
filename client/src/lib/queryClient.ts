import { QueryClient, QueryFunction } from "@tanstack/react-query";

const ADMIN_PASSWORD_KEY = "charitable-admin-password";

// The shared admin password lives in sessionStorage so it's cleared when the tab closes.
export function getAdminPassword(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_PASSWORD_KEY);
  } catch {
    return null;
  }
}

export function setAdminPassword(password: string | null) {
  try {
    if (password) sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
    else sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  } catch {
    // Storage unavailable (e.g. private mode); the user will be asked again.
  }
}

export function adminHeaders(url: string): Record<string, string> {
  const password = url.startsWith("/api/admin") ? getAdminPassword() : null;
  return password ? { Authorization: `Bearer ${password}` } : {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...adminHeaders(url),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const res = await fetch(url, {
      headers: adminHeaders(url),
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
