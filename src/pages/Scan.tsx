import { useRef, useState } from 'react'
import api from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface ApiResponse {
  found: boolean
  transform?: string
  results?: Array<{ type: string; data: string }>
  data?: string | string[]
  message?: string
}

export default function Scan() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string)
      }
      reader.readAsDataURL(selected)
      setFeedback(null)
    } else {
      setFile(null)
      setPreview(null)
      setFeedback({ type: 'error', text: 'Por favor, selecione uma imagem válida.' })
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setFeedback(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await api.post('/decode', { image_base64: base64 })
      setApiResponse(res.data)
      setModalOpen(true)
      setFeedback({ type: 'success', text: 'QR Code decodificado com sucesso!' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setFeedback({ type: 'error', text: 'Erro ao enviar imagem: ' + message })
    } finally {
      setLoading(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const clearImage = () => {
    setFile(null)
    setPreview(null)
    setFeedback(null)
    setApiResponse(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className="px-5 pt-8 pb-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-dark-900">Escanear QR Code</h1>
            <p className="text-sm text-dark-500 mt-1">Envie uma foto para decodificar o QR Code</p>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl shadow-card p-5 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!preview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="w-full border-2 border-dashed border-dark-200 rounded-xl py-12 flex flex-col items-center justify-center hover:border-brand-400 hover:bg-brand-50/30 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-brand-500" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-dark-700">Tirar foto ou escolher imagem</span>
                <span className="text-xs text-dark-400 mt-1">PNG, JPG até 10MB</span>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview da imagem"
                  className="w-full rounded-xl object-contain max-h-64"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-dark-900/60 hover:bg-dark-900/80 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-4">
            {preview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="flex-1 bg-white border border-dark-200 text-dark-700 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-dark-50 active:scale-[0.98]"
              >
                Trocar imagem
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              type="button"
              className={`${preview ? 'flex-1' : 'w-full'} bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar imagem
                </>
              )}
            </button>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                  feedback.type === 'success'
                    ? 'bg-success-50 text-success-600'
                    : 'bg-danger-50 text-danger-600'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-dark-900/50 px-4 pb-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-900">Resultado</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-dark-600" />
                </button>
              </div>
              <pre className="bg-dark-50 border border-dark-200 rounded-xl p-4 text-sm text-dark-700 overflow-x-auto mb-4 max-h-60">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
              <button
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                onClick={() => setModalOpen(false)}
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
