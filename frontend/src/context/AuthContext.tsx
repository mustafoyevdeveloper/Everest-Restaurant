import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  password?: string;
  phone?: string;
  isProfileComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  manualLogin: (user: User, token: string) => void;
  signup: (name: string, email: string, password: string) => Promise<User>;
  verifyCode: (email: string, code: string) => Promise<{ redirectTo: string }>;
  updateProfile: (phone: string) => Promise<void>;
  sendPasswordResetCode: (email: string) => Promise<void>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  handleGoogleCallback: (token: string, userData: string) => void;
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
          // Token is invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('isNewUser');
          setUser(null);
          setToken(null);
          setError(null);
        }
      } catch (error) {
        // Network error or other issues
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
        const errorMessage = errorData.message || 'Login failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
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
    
    // Get current language
    const currentLanguage = localStorage.getItem('i18nextLng') || 'uz';
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, language: currentLanguage }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsNewUser(true);
        return data;
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Signup failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (email: string, code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        setIsNewUser(false);
        localStorage.setItem('token', data.token);
        localStorage.setItem('isNewUser', 'false');
        return data;
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Verification failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Verification failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (phone: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return data;
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Profile update failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetCode = async (email: string) => {
    setLoading(true);
    setError(null);
    
    // Get current language
    const currentLanguage = localStorage.getItem('i18nextLng') || 'uz';
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-password-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language: currentLanguage }),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Failed to send reset code';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset code';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyPasswordResetCode = async (email: string, code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-password-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Failed to verify reset code';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to verify reset code';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Failed to reset password';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCallback = (token: string, userData: string) => {
    try {
      const user = JSON.parse(decodeURIComponent(userData));
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      setError(null);
      setIsNewUser(false);
      localStorage.setItem('isNewUser', 'false');
    } catch (error) {
      setError('Failed to process Google authentication');
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
        // Ignore logout errors
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
      login, 
      manualLogin, 
      signup,
      verifyCode,
      updateProfile,
      sendPasswordResetCode,
      verifyPasswordResetCode,
      resetPassword,
      handleGoogleCallback,
      logout, 
      loading, 
      error,
      updateUser,
      isProfileComplete,
      getProfileCompletionStatus,
      isNewUser: isNewUserCheck
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
