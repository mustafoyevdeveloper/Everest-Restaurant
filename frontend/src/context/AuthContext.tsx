import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  password?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  manualLogin: (user: User, token: string) => void;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  updateUser: (user: User) => void;
  isProfileComplete: () => boolean;
  getProfileCompletionStatus: () => { complete: boolean; missing: string[] };
  isNewUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(() => {
    const saved = localStorage.getItem('isNewUser');
    return saved === 'true';
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setError(null);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('isNewUser');
          setUser(null);
          setToken(null);
          setError(null);
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('isNewUser');
        setUser(null);
        setToken(null);
        setError('Failed to verify authentication');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const isNewUserCheck = () => {
    return isNewUser;
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
      const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        setIsNewUser(false);
        localStorage.setItem('token', data.token);
        localStorage.setItem('isNewUser', 'false');
      return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const manualLogin = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    setError(null);
    setIsNewUser(false);
    localStorage.setItem('token', token);
    localStorage.setItem('isNewUser', 'false');
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
      const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        setIsNewUser(true);
      localStorage.setItem('token', data.token);
        localStorage.setItem('isNewUser', 'true');
      return data.user;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Signup failed');
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // Ignore
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('isNewUser');
    setUser(null);
    setToken(null);
    setIsNewUser(false);
  };

  const updateUser = (user: User) => {
    setUser(user);
    setError(null);
    // Faqat profil to'liq bo'lganda isNewUser ni false qilamiz
    if (user.name && user.phone && user.email) {
      setIsNewUser(false);
      localStorage.setItem('isNewUser', 'false');
    }
  };

  const isProfileComplete = () => {
    if (!user) return false;
    return !!(user.name && user.phone && user.email);
  };

  const getProfileCompletionStatus = () => {
    if (!user) return { complete: false, missing: [] };
    
    const missing = [];
    if (!user.name) missing.push('name');
    if (!user.phone) missing.push('phone');
    if (!user.email) missing.push('email');
    
    return {
      complete: missing.length === 0,
      missing
    };
  };

  const value = {
      user, 
      token, 
    loading,
    error,
      login, 
    manualLogin,
      signup, 
      logout, 
    updateUser,
    isProfileComplete,
    getProfileCompletionStatus,
    isNewUser: isNewUserCheck,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
