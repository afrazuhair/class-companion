import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Profile, signIn as authSignIn, signUp as authSignUp } from "@/lib/auth";

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, role: "teacher" | "student") => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = "att_profile";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Profile;
        setProfile(parsed);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, profile } = await authSignIn(email, password);
    if (profile) {
      setProfile(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    }
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, role: "teacher" | "student") => {
    const result = await authSignUp(email, password, name, role);
    return { error: result.error };
  };

  const signOut = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
