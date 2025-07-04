import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'

interface User {
  id: string
  name: string
  email: string
  // …any other profile fields
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // On mount, rehydrate token & fetch profile if present
  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) {
      setToken(t)
      fetchProfile(t)
    }
  }, [])

  // helper to fetch /api/users/me
  async function fetchProfile(jwt: string) {
    const res = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (res.ok) {
      const me: User = await res.json()
      setUser(me)
    } else {
      logout() // invalid token
    }
  }

  // Step 1: trigger OTP email
  async function login(email: string) {
    await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  }

  // Step 2: verify code, get JWT & profile
  async function verifyOtp(email: string, code: string) {
    const res = await fetch('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    if (!res.ok) throw new Error('OTP verification failed')
    const { token: newToken } = (await res.json()) as { token: string }
    localStorage.setItem('token', newToken)
    setToken(newToken)
    await fetchProfile(newToken)
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