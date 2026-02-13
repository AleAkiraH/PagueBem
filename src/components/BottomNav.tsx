import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Home, ScanLine, LogOut } from 'lucide-react'

export default function BottomNav() {
  const loc = useLocation()
  const { token, logout } = useAuth()

  if (!token) return null

  const items = [
    { to: '/inicio', label: 'Início', icon: Home },
    { to: '/scan', label: 'Scan', icon: ScanLine, primary: true },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-dark-200 shadow-nav z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {items.map((it) => {
          const active = loc.pathname === it.to
          const Icon = it.icon

          if (it.primary) {
            return (
              <Link key={it.to} to={it.to} className="flex flex-col items-center -mt-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${active ? 'bg-brand-600 scale-110' : 'bg-brand-500 hover:bg-brand-600'}`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <span className={`text-[10px] mt-1 font-medium ${active ? 'text-brand-600' : 'text-dark-500'}`}>{it.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex flex-col items-center py-2 px-3 transition-colors duration-150"
            >
              <div className={`p-1.5 rounded-xl transition-colors duration-150 ${active ? 'bg-brand-50' : ''}`}>
                <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-dark-400'}`} strokeWidth={active ? 2 : 1.5} />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-brand-600' : 'text-dark-500'}`}>{it.label}</span>
            </Link>
          )
        })}

        <button onClick={logout} className="flex flex-col items-center py-2 px-3">
          <div className="p-1.5 rounded-xl">
            <LogOut className="w-5 h-5 text-dark-400" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium text-dark-500">Sair</span>
        </button>
      </div>
    </nav>
  )
}
