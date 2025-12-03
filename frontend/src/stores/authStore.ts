import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  role: 'patient' | 'doctor' | 'admin';
  fullName: string;
  email: string;
  avatar?: string;

  phone?: string;
  profile?: {
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    insurance?: string;
    occupation?: string;
    condition?: string;
  };
}


export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              ...updates,
              profile: {
                ...currentUser.profile,
                ...updates.profile,
              },
            },
          });
        }
      },
    }),
    {
      name: 'healthcare-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);