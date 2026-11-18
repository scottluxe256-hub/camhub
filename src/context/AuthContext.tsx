import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { ProfileItem } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: ProfileItem | null;
  isAdmin: boolean;
  loadingAuth: boolean;
  refreshProfile: () => Promise<void>;
}

// Placeholder sementara sebelum diisi logika penuh di Part 4
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth(): AuthContextType {
  return {
    session: null,
    user: null,
    profile: null,
    isAdmin: false,
    loadingAuth: false,
    refreshProfile: async () => {},
  };
}
