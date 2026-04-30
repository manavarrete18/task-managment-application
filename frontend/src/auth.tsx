import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthResponse } from './types'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

const STORAGE_KEY = 'task-management-session'

export function AuthProvider ({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(() => {
    const storedSession = localStorage.getItem(STORAGE_KEY)
    return storedSession ? JSON.parse(storedSession) as AuthResponse : null
  })

  const value = useMemo<AuthContextValue>(() => ({
    session,
    login(nextSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY)
      setSession(null)
    }
  }), [session])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
