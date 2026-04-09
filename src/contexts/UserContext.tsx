'use client';
import { createContext, useContext } from 'react';

interface UserCtx {
  id: string;
  email: string;
}

const Ctx = createContext<UserCtx | null>(null);

export function UserProvider({ user, children }: { user: UserCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useUser() {
  const u = useContext(Ctx);
  if (!u) throw new Error('useUser must be used within UserProvider');
  return u;
}
