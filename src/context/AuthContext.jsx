import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthChange, logoutUser } from "../services/authService";
import { getUserProfile, createUserProfile } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (user && user.uid) {
      try {
        const p = await getUserProfile(user.uid);
        if (p) {
          setProfile(p);
        }
      } catch (err) {
        console.warn("Failed to refresh profile:", err);
      }
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthChange(async (currentUser) => {
      if (!isMounted) return;

      setUser(currentUser);

      if (currentUser && currentUser.uid) {
        try {
          let userProfile = await getUserProfile(currentUser.uid);
          if (!userProfile) {
            userProfile = await createUserProfile(currentUser.uid, {
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            });
          }
          if (isMounted) {
            setProfile(userProfile);
          }
        } catch (err) {
          console.error("Error loading profile:", err);
          if (isMounted) {
            setProfile(null);
          }
        }
      } else {
        if (isMounted) {
          setProfile(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
      setProfile(null);
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}