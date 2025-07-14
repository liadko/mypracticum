// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DesktopApp from './pages/DesktopApp'
import { ContactsProvider } from './context/ContactsContext'
import { EntriesProvider } from './context/EntriesContext'
import { Toaster } from 'react-hot-toast'
import { ToastLimiter } from './components/Toast/ToastLimiter'

function AppRoutes() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      {/* OTP/login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected app */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <ContactsProvider>
              <EntriesProvider>
                <DesktopApp userName={user!.name} />
              </EntriesProvider>
            </ContactsProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>

                <AppRoutes />


                <div dir="rtl">
                    <Toaster
                        position="bottom-center"
                        containerStyle={{ zIndex: 9999 }}
                        
                        toastOptions={{
                            success: { style: { background: 'var(--main-color)', color: '#fff' } },
                            error: { style: { background: '#f44336', color: '#fff' } },
                            style: { zIndex: 9999 },
                        }}

                        
                    />
                    <ToastLimiter/>
                </div>
            </BrowserRouter>
        </AuthProvider>
    )
}
