import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { ScanLine, QrCode, History } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { token } = useAuth()

  // Extract user name from JWT token
  const getUserName = () => {
    if (!token) return 'Usuário'
    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) return 'Usuário'
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(
        decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
      )
      return payload.nome || payload.name || payload.email || 'Usuário'
    } catch {
      return 'Usuário'
    }
  }

  return (
    <div className="px-5 pt-8 pb-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="mb-8">
          <p className="text-dark-500 text-sm">Olá,</p>
          <h1 className="text-2xl font-bold text-dark-900">{getUserName()} 👋</h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link to="/scan" className="bg-white rounded-2xl shadow-card p-5 hover:shadow-card-hover transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
              <ScanLine className="w-5 h-5 text-brand-600" strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-semibold text-dark-800">Escanear QR Code</h3>
            <p className="text-xs text-dark-500 mt-1">Envie uma foto para decodificar</p>
          </Link>

          <div className="bg-white rounded-2xl shadow-card p-5 opacity-60">
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center mb-3">
              <History className="w-5 h-5 text-success-600" strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-semibold text-dark-800">Histórico</h3>
            <p className="text-xs text-dark-500 mt-1">Em breve</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <QrCode className="w-8 h-8" strokeWidth={1.5} />
            <h2 className="text-lg font-bold">PagueBem</h2>
          </div>
          <p className="text-sm text-brand-100 leading-relaxed">
            Escaneie QR Codes de boletos e cobranças para extrair as informações de pagamento rapidamente.
          </p>
          <Link
            to="/scan"
            className="inline-block mt-4 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
          >
            Escanear agora →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
