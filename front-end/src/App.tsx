import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/hooks/useAuth'
import Header from '@/shared/components/Header'
import Landing from '@/auth/pages/Landing'
import Callback from '@/auth/pages/Callback'
import SubmitCode from '@/code/pages/SubmitCode'
import MySubmissions from '@/submissions/pages/MySubmissions'
import UserProfile from '@/profile/pages/UserProfile'
import Admin from '@/admin/pages/Admin'
import AdminRoute from '@/auth/components/AdminRoute'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

function App() {
  const { isLoading, isAuthenticated } = useAuth()

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
      <Routes>
        {/* Landing page - only show header if authenticated */}
        <Route path="/" element={
          <>
            {isAuthenticated && <Header />}
            <Landing />
          </>
        } />
        <Route path="/callback" element={<Callback />} />

        {/* Protected routes with header */}
        <Route path="/submit" element={
          <>
            <Header />
            <SubmitCode />
          </>
        } />
        <Route path="/submissions" element={
          <>
            <Header />
            <MySubmissions />
          </>
        } />
        <Route path="/profile" element={
          <>
            <Header />
            <UserProfile />
          </>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <>
            <Header />
            <AdminRoute>
              <Admin />
            </AdminRoute>
          </>
        } />

        {/* Redirect authenticated users from landing to submit */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
