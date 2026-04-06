import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/integrations/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "teacher" | "student";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signup: (name: string, email: string, password: string, role: "teacher" | "student") => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: userData.name || "",
              role: userData.role || "student",
            });
          } else {
            // User logged in but no user document exists yet
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: "",
              role: "student",
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (name: string, email: string, password: string, role: "teacher" | "student") => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      const userData = { name, email, role, createdAt: new Date() };
      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      setUser({ id: firebaseUser.uid, email, name, role });
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: userData?.name || "",
        role: userData?.role || "student",
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
