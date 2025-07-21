// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import StudentLayout from './pages/StudentLayout'
import { ContactsProvider } from './context/ContactsContext'
import { EntriesProvider } from './context/EntriesContext'
import { Toaster } from 'react-hot-toast'
import { ToastLimiter } from './components/Toast/ToastLimiter'
import ProtectedRoute from './pages/ProtectedRoute'
import { useEffect } from 'react'
import MentorLayout from './pages/MentorLayout'

function AppRoutes() {
  const { isLoading, user } = useAuth()
  const navigate = useNavigate()


  useEffect(() => {
    if (!user) return
    const dest = user.roles.includes('mentor')
      ? '/mentor'
      : '/student'
    navigate(dest, { replace: true })
  }, [user, navigate])

  if (isLoading) return <div>Loading authentication…</div>

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/student"
          element={
            <ContactsProvider>
              <EntriesProvider>
                <StudentLayout
                  user={user!}
                />
              </EntriesProvider>
            </ContactsProvider>
          }
        />
        <Route
          path="/mentor"
          element={<MentorLayout user={user!} />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
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