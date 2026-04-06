export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = { "Content-Type": "application/json", ...(options.headers as Record<string, string> | undefined) };
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error || response.statusText || "API request failed";
    throw new Error(message);
  }

  return data as T;
}
