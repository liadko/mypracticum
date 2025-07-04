import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DesktopApp from './pages/DesktopApp'
import ProtectedRoute from './components/Login/ProtectedRoute'
import { ContactsProvider } from './context/ContactsContext'
import { EntriesProvider } from './context/EntriesContext'
import { Toaster } from 'react-hot-toast'

function AppRoutes() {
  const { user, isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            {/* now Contacts/Entries fetch by looking at the JWT (no studentId prop) */}
            <ContactsProvider>
              <EntriesProvider>
                {/* pass the user’s name into your app */}
                <DesktopApp userName={user?.name || ''} />
              </EntriesProvider>
            </ContactsProvider>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? '/' : '/login'} replace />
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
              error:   { style: { background: '#f44336', color: '#fff' } },
              style:   { zIndex: 9999 },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
