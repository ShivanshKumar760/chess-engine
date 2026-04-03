import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProfile } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  wins?: number;
  losses?: number;
  draws?: number;
  gamesPlayed?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  setAuth: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('chess_token');
    if (savedToken) {
      getProfile(savedToken)
        .then((data) => {
          setToken(savedToken);
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('chess_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setAuth = (newToken: string, newUser: User) => {
    localStorage.setItem('chess_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('chess_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
