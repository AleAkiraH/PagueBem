import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { token, logout } = useAuth()

  if (!token) return <Navigate to="/entrar" replace />

  // Validação extra: decodifica o JWT e verifica expiração
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) throw new Error('Token inválido')
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      )
    )
    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      logout()
      return <Navigate to="/entrar" replace />
    }
  } catch {
    logout()
    return <Navigate to="/entrar" replace />
  }

  return children
}
