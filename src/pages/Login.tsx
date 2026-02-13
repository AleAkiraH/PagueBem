import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'
import { QrCode, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { token, saveToken } = useAuth()
  const navigate = useNavigate()
  const [nome_usuario, setNome_usuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/inicio" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/entrar', { nome_usuario, senha })
      saveToken(data.token)
      navigate('/inicio')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setErro(axiosErr.response?.data?.error || 'Erro ao entrar')
      setTimeout(() => setErro(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-50 px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4">
            <QrCode className="w-8 h-8 text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold text-dark-900">PagueBem</h1>
          <p className="text-dark-500 text-sm mt-1">Leia QR Codes e pague com facilidade</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-dark-800 mb-1">Bem-vindo de volta</h2>
          <p className="text-sm text-dark-500 mb-6">Entre com sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-dark-600 mb-1.5 block">Usuário</label>
              <input
                value={nome_usuario}
                onChange={(e) => setNome_usuario(e.target.value)}
                placeholder="seu nome de usuário"
                type="text"
                className="w-full px-4 py-3 bg-dark-50 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-dark-600 mb-1.5 block">Senha</label>
              <div className="relative">
                <input
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  type={showPw ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-dark-50 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all pr-11"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-danger-50 text-danger-600 text-sm px-4 py-2.5 rounded-xl">
                {erro}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-dark-500 mt-6">
          Não tem conta?{' '}
          <Link to="/registrar" className="text-brand-600 font-medium hover:underline">Criar conta</Link>
        </p>
      </motion.div>
    </div>
  )
}
