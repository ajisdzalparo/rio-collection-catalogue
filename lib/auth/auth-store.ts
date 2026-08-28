import { create } from 'zustand';
import { getToken, setToken as saveToken, removeToken } from './token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? getToken() : null,
  isAuthenticated: typeof window !== 'undefined' ? !!getToken() : false,

  setAuth: (user, token) => {
    saveToken(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    removeToken();
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
