import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'
import * as authApi from '../api/authApi'
import type { User } from '../api/authApi'

interface AuthProviderProps {
  children: React.ReactNode
}

interface AuthContextType {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (email: string) => Promise<void>
  verifyOtp: (email: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) {
      setToken(t)
      authApi.fetchProfile(t).then(setUser).catch(logout)
    }
  }, [])

  async function login(email: string) {
    await authApi.login(email)
  }

  async function verifyOtp(email: string, code: string) {
    const { token: newToken } = await authApi.verifyOtp(email, code)
    localStorage.setItem('token', newToken)
    setToken(newToken)
    const profile = await authApi.fetchProfile(newToken)
    setUser(profile)
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        login,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}