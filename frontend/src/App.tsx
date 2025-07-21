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
  const { isLoading, user } = useAuth()

  // While loading, don’t even decide about login vs app
  if (isLoading) {
    return <div>Loading authentication…</div>
  }

  if (!user)
    return <LoginPage />

  return (
    <ContactsProvider>
      <EntriesProvider>
        <DesktopApp user={user}
        />
      </EntriesProvider>
    </ContactsProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>

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
        <ToastLimiter />
      </div>
    </AuthProvider>
  )
}
