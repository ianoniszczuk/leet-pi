import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import Home from '@/pages/Home'
import Callback from '@/pages/Callback'
import SubmitCode from '@/pages/SubmitCode'
import MySubmissions from '@/pages/MySubmissions'
import UserProfile from '@/pages/UserProfile'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/submit" element={<SubmitCode />} />
          <Route path="/submissions" element={<MySubmissions />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
