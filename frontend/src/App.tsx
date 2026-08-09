// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/Login/LoginPage'
import { AdminRoute } from './pages/Login/AdminRoute'
import { Toaster } from 'react-hot-toast'
import { ToastLimiter } from './components/Toast/ToastLimiter'
import { ProtectedRoute, ProvidersWrapper } from './pages/Login/SpecialRoutes'
import { lazy, Suspense, useEffect } from 'react'
import DesktopLayout from './pages/DesktopLayout'
import { ReportsRoute } from './pages/Reports/ReportsRoute'

const AdminPage = lazy(() => import('./pages/AdminSide/AdminPage'));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));

function AppRoutes() {
  const { isLoading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation(); // Get the current location


  useEffect(() => {
    if (!user) return

    if ((user.roles.includes('admin') || user.roles.includes('analyst')) && (location.pathname === '/admin' || location.pathname === '/reports')) return

    const dest = user.roles.includes('analyst') && !user.roles.includes('admin')
      ? '/reports'
      : user.roles.includes('student') ? '/student' : '/mentor'

    navigate(dest, { replace: true })
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
                layoutType='student'
              />
            }
          />
          <Route
            path="/mentor"
            element={<DesktopLayout
              layoutType="mentor"
            />}
          />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense fallback={<div>Loading Admin...</div>}>
                <AdminPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route path="/reports" element={<ReportsRoute><Suspense fallback={<div>Loading reports...</div>}><ReportsPage /></Suspense></ReportsRoute>} />
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
