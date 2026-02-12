import { useRef, useState } from 'react'
import api from '../lib/api'

interface ApiResponse {
  found: boolean
  transform?: string
  results?: Array<{ type: string; data: string }>
  data?: string | string[]
  message?: string
}

export default function ImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
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
      setFeedback('')
    } else {
      setFile(null)
      setPreview(null)
      setFeedback('Por favor, selecione uma imagem válida.')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setFeedback('')
    try {
      const base64 = await fileToBase64(file)
      const res = await api.post('/decode', { image_base64: base64 })
      setApiResponse(res.data)
      setModalOpen(true)
      setFeedback('Imagem enviada com sucesso!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setFeedback('Erro ao enviar imagem: ' + message)
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

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="mb-6 text-center text-base text-slate-700">
          Envie uma foto usando a câmera ou escolha da galeria.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          className="flex items-center justify-center bg-blue-600 text-white rounded-xl px-6 py-3 mb-5 text-base font-medium hover:bg-blue-700 transition"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="mr-2">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <circle cx="12" cy="13" r="4" />
            <path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
          </svg>
          Tirar foto ou escolher imagem
        </button>
        <div className="w-full max-w-xs min-h-[120px] bg-slate-200 rounded-xl flex items-center justify-center mb-5 overflow-hidden">
          {preview ? (
            <img src={preview} alt="Preview da imagem" className="w-full h-auto object-contain" />
          ) : (
            <span className="text-slate-400">Nenhuma imagem selecionada</span>
          )}
        </div>
        <button
          className="bg-green-500 text-white rounded-xl px-6 py-3 text-base font-medium disabled:bg-green-200 disabled:cursor-not-allowed transition"
          onClick={handleUpload}
          disabled={!file || loading}
          type="button"
        >
          {loading ? 'Enviando...' : 'Enviar imagem'}
        </button>
        <div className="mt-4 text-center text-base min-h-[24px]">
          {feedback}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Retorno da API</h2>
            <pre className="bg-slate-100 rounded p-2 text-sm overflow-x-auto mb-4 max-h-60">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition w-full"
              onClick={() => setModalOpen(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
