import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginDemo: (key: DemoRoleKey) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

export type DemoRoleKey =
  | 'SUPER_ADMIN'
  | 'MANAGER_ABC'
  | 'MANAGER_XYZ'
  | 'EMPLOYEE_RAHUL'
  | 'EMPLOYEE_PRIYA';

export const DEMO_PRESETS: Record<
  DemoRoleKey,
  { username: string; pass: string; title: string; desc: string; role: Role; org: string }
> = {
  SUPER_ADMIN: {
    username: 'superadmin',
    pass: 'Admin@123',
    title: 'Super Admin',
    desc: 'Centralized control: all orgs, threat graph, alerts & rules',
    role: 'SUPER_ADMIN',
    org: 'Global Centralized',
  },
  MANAGER_ABC: {
    username: 'manager_abc',
    pass: 'Manager@123',
    title: 'Org Manager (ABC Tech)',
    desc: 'Manages ABC Technologies employees & credentials',
    role: 'ORGANIZATION_MANAGER',
    org: 'ABC Technologies',
  },
  MANAGER_XYZ: {
    username: 'manager_xyz',
    pass: 'Manager@123',
    title: 'Org Manager (XYZ Solutions)',
    desc: 'Manages XYZ Solutions employees & credentials',
    role: 'ORGANIZATION_MANAGER',
    org: 'XYZ Solutions',
  },
  EMPLOYEE_RAHUL: {
    username: 'emp_rahul',
    pass: 'Employee@123',
    title: 'Employee (Rahul - ABC Tech)',
    desc: 'Personal login history, profile & security status',
    role: 'EMPLOYEE',
    org: 'ABC Technologies',
  },
  EMPLOYEE_PRIYA: {
    username: 'emp_priya',
    pass: 'Employee@123',
    title: 'Employee (Priya - XYZ)',
    desc: 'Personal login history, profile & security status',
    role: 'EMPLOYEE',
    org: 'XYZ Solutions',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tg_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          localStorage.removeItem('tg_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        setIsLoading(false);
        return false;
      }

      localStorage.setItem('tg_token', data.token);
      setToken(data.token);
      setUser({
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        active: true,
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Network error during login');
      setIsLoading(false);
      return false;
    }
  };

  const loginDemo = async (key: DemoRoleKey) => {
    const creds = DEMO_PRESETS[key];
    return login(creds.username, creds.pass);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('tg_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginDemo,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
