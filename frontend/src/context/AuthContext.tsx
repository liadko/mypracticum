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
  submitEmail: (email: string) => Promise<void>
  verifyOtp: (code: string) => Promise<void>
  logout: () => void
  secondsLeft: number
  submittedEmail: string | null

}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const OTP_TIMEOUT = 2 * 60 * 1000  // 2 minutes in ms

  // load any previous timestamp
  const [otpSentAt, setOtpSentAt] = useState<number>(() => {
    const saved = localStorage.getItem('otpSentAt')
    return saved ? +saved : 0
  })

  // initialize secondsLeft based on that timestamp
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!otpSentAt) return 0
    const diff = Date.now() - otpSentAt
    return diff < OTP_TIMEOUT
      ? Math.ceil((OTP_TIMEOUT - diff) / 1000)
      : 0
  })

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(
    () => localStorage.getItem('submittedEmail')
  )

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) {
      setToken(t)
      authApi.fetchProfile(t).then(setUser).catch(logout)
    }
  }, [])

  useEffect(() => {
    if (!otpSentAt || secondsLeft <= 0) return

    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timer)


          setOtpSentAt(0)
          localStorage.removeItem('otpSentAt')

          setSubmittedEmail(null)
          localStorage.removeItem('submittedEmail')


          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [otpSentAt])

  async function submitEmail(email: string) {

    await authApi.login(email)

    // record email
    setSubmittedEmail(email)
    localStorage.setItem('submittedEmail', email)

    // record time
    const ts = Date.now()
    setOtpSentAt(ts)
    localStorage.setItem('otpSentAt', ts.toString())
    setSecondsLeft(OTP_TIMEOUT / 1000)

  }

  // should only be called when submittedEmail exists

  async function verifyOtp(code: string) {
    if (!submittedEmail) {
      console.error("verifyOtp was called without an existing submittedEmail")
      return;
    }

    const { token: newToken } = await authApi.verifyOtp(submittedEmail, code)
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
        submitEmail,
        verifyOtp,
        logout,
        secondsLeft,
        submittedEmail
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