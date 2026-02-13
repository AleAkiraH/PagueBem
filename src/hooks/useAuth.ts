import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type AuthContextType = {
  token: string | null
  saveToken: (t: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return true // token inválido ou sem exp = expirado
  return Date.now() >= (payload.exp as number) * 1000
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('token')
    if (stored && isTokenExpired(stored)) {
      localStorage.removeItem('token')
      return null
    }
    return stored
  })

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
  }, [])

  function saveToken(t: string) {
    localStorage.setItem('token', t)
    setToken(t)
  }

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        logout()
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [token, logout])

  return React.createElement(AuthContext.Provider, { value: { token, saveToken, logout } }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
