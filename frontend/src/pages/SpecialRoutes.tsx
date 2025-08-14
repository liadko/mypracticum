import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ContactsProvider } from '../context/ContactsContext'
import { EntriesProvider } from '../context/EntriesContext'

export function ProtectedRoute() {
  const { user } = useAuth()
  return user
    ? <Outlet />
    : <Navigate to="/login" replace />
}

export function ProvidersWrapper() {
  return (
    <ContactsProvider>
      <EntriesProvider>
        <Outlet />
      </EntriesProvider>
    </ContactsProvider>
  )
}