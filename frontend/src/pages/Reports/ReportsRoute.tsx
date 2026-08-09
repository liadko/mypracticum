import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ReportsRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!user.roles.includes('admin') && !user.roles.includes('analyst')) {
    return <Navigate to={user.roles.includes('student') ? '/student' : '/mentor'} replace />
  }
  return <>{children}</>
}
