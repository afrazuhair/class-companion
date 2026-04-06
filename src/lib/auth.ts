import { apiFetch } from "@/lib/api";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
}

export async function signIn(email: string, password: string): Promise<{ error: string | null; profile?: Profile }> {
  try {
    const result = await apiFetch<{ profile: Profile }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return { error: null, profile: result.profile };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Login failed" };
  }
}

export async function signUp(email: string, password: string, name: string, role: "teacher" | "student"): Promise<{ error: string | null }> {
  try {
    await apiFetch<{ profile: Profile }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Sign up failed" };
  }
}
