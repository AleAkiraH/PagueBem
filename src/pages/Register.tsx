import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'
import { QrCode, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [nome_usuario, setNome_usuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/inicio" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/registrar', { nome_usuario, senha })
      setSucesso(data.mensagem || 'Conta criada com sucesso!')
      setTimeout(() => navigate('/entrar'), 1200)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setErro(axiosErr.response?.data?.error || 'Erro ao registrar')
      setTimeout(() => setErro(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-50 px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success-500 mb-4">
            <QrCode className="w-8 h-8 text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Criar conta</h1>
          <p className="text-dark-500 text-sm mt-1">Comece a usar o PagueBem hoje</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-dark-600 mb-1.5 block">Usuário</label>
              <input
                value={nome_usuario}
                onChange={(e) => setNome_usuario(e.target.value)}
                placeholder="escolha um nome de usuário"
                className="w-full px-4 py-3 bg-dark-50 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success-400/30 focus:border-success-500 transition-all"
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
                  className="w-full px-4 py-3 bg-dark-50 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success-400/30 focus:border-success-500 transition-all pr-11"
                  autoComplete="new-password"
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
            {sucesso && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-success-50 text-success-600 text-sm px-4 py-2.5 rounded-xl">
                {sucesso}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-success-500 hover:bg-success-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-dark-500 mt-6">
          Já tem conta?{' '}
          <Link to="/entrar" className="text-brand-600 font-medium hover:underline">Entrar</Link>
        </p>
      </motion.div>
    </div>
  )
}
