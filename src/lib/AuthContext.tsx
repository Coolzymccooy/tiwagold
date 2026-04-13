import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  tier: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  login: (email: string, isSignUp?: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('tiwa_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, isSignUp = false) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser = { id: 'usr_1', name: 'Trader', email, tier: 'Pro Tier' };
    setUser(newUser);
    localStorage.setItem('tiwa_user', JSON.stringify(newUser));
    if (isSignUp) {
      setIsFirstLogin(true);
    }
  };

  const logout = () => {
    setUser(null);
    setIsFirstLogin(false);
    localStorage.removeItem('tiwa_user');
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('tiwa_user', JSON.stringify(updatedUser));
  };

  const completeOnboarding = () => {
    setIsFirstLogin(false);
  };

  if (!isInitialized) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isFirstLogin, login, logout, updateUser, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
