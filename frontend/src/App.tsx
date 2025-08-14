// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import StudentLayout from './pages/StudentSide/StudentLayout'
import { ContactsProvider } from './context/ContactsContext'
import { EntriesProvider } from './context/EntriesContext'
import { Toaster } from 'react-hot-toast'
import { ToastLimiter } from './components/Toast/ToastLimiter'
import { ProtectedRoute, ProvidersWrapper } from './pages/SpecialRoutes'
import { useEffect } from 'react'
import MentorLayout from './pages/MentorSide/MentorLayout'
import DesktopLayout from './pages/DesktopLayout'

function AppRoutes() {
  const { isLoading, user } = useAuth()
  const navigate = useNavigate()


  useEffect(() => {
    if (!user) return
    const dest = user.roles.includes('mentor')
      ? '/mentor'
      : '/student'

    navigate('/mentor', { replace: true })
  }, [user, navigate])

  if (isLoading) return <div>Loading authentication…</div>

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />


      <Route element={<ProtectedRoute />}>
        <Route element={<ProvidersWrapper />}>
          <Route
            path="/student"
            element={
              <DesktopLayout
                user={user!}
                layoutType='student'
              />
            }
          />
          <Route
            path="/mentor"
            element={<DesktopLayout
              user={user!}
              layoutType="mentor"
            />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <AppRoutes />

        <div dir="rtl">
          <Toaster
            position="bottom-center"
            containerStyle={{ zIndex: 9999 }}
            toastOptions={{
              success: { style: { background: 'var(--main-color)', color: '#fff' } },
              error: { style: { background: '#f44336', color: '#fff' } },
            }}
          />
          <ToastLimiter />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}