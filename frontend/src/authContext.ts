import { createContext } from 'react'
import type { AuthResponse } from './types'

export type AuthContextValue = {
  session: AuthResponse | null;
  login(session: AuthResponse): void;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null)

