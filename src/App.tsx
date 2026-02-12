import ImageUpload from './components/ImageUpload'

function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-slate-50">
      <header className="w-full py-6 bg-blue-600 text-white text-center text-2xl font-semibold rounded-b-2xl shadow">
        PagueBem — Upload de Imagem
      </header>
      <div className="w-full max-w-md px-4 py-8 flex flex-col items-center">
        <ImageUpload />
      </div>
    </main>
  )
}

export default App
