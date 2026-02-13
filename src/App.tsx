import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import BottomNav from './components/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import { AnimatePresence, motion } from 'framer-motion'

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: 'easeOut' as const }
}

function Page({ children }: { children: React.ReactNode }) {
  return <motion.div {...pageTransition}>{children}</motion.div>
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <div className="min-h-screen bg-dark-50 pb-24">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/entrar" replace />} />
              <Route path="/entrar" element={<Page><Login /></Page>} />
              <Route path="/registrar" element={<Page><Register /></Page>} />
              <Route path="/inicio" element={<ProtectedRoute><Page><Dashboard /></Page></ProtectedRoute>} />
              <Route path="/scan" element={<ProtectedRoute><Page><Scan /></Page></ProtectedRoute>} />
            </Routes>
          </AnimatePresence>
        </div>
        <BottomNav />
      </div>
      <Analytics />
    </>
  )
}
