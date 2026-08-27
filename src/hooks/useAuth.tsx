import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId: string | null;
};

type Business = {
  id: string;
  name: string;
  type: string;
  currency: string;
  registrationNumber?: string | null;
  ownerName?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  whatsappSettings?: any;
};

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  login: (token: string, user: User, business: Business | null) => void;
  logout: () => void;
  updateBusiness: (updatedBusiness: Partial<Business>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedBusiness = localStorage.getItem('business');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedBusiness && storedBusiness !== 'undefined') {
        setBusiness(JSON.parse(storedBusiness));
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newBusiness: Business | null) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (newBusiness) {
      localStorage.setItem('business', JSON.stringify(newBusiness));
    }
    setToken(newToken);
    setUser(newUser);
    setBusiness(newBusiness);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('business');
    setToken(null);
    setUser(null);
    setBusiness(null);
  };

  const updateBusiness = (updatedFields: Partial<Business>) => {
    setBusiness((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('business', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, business, token, login, logout, updateBusiness, isLoading }}>
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
