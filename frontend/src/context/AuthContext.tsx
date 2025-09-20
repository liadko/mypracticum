import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'
import * as authApi from '../api/authApi'
import type { User } from '../types'


interface AuthProviderProps {
  children: React.ReactNode
}

interface AuthContextType {
  token: string | null
  user: User | null
  isLoading: boolean

  submitEmail: (email: string) => Promise<void>
  verifyOtp: (code: string) => Promise<void>
  logout: () => void
  secondsLeft: number
  submittedEmail: string | null

  
  updateSignature: (sig: string) => Promise<void>


}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)    // ← start “loading”
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
    }
  }, [])

  // ② Whenever token changes, fetch (or clear) the user (with up to 3 retries)
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    async function fetchProfileWithRetries() {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const u = await authApi.fetchProfile()
          if (cancelled) return
          console.log(u)
          setUser(u)
          break
        } catch (e) {
          console.error(`fetchProfile attempt ${attempt} failed:`, e)
          if (attempt === 3) {
            // after three failures, clear token and user
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        }
      }
      if (!cancelled) setIsLoading(false)
    }

    console.log("fetching profile...")
    fetchProfileWithRetries()

    return () => {
      cancelled = true
    }
  }, [token])

  // COUNTDOWN
  useEffect(() => {
    if (!otpSentAt || secondsLeft <= 0) return

    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timer)


          setOtpSentAt(0)
          localStorage.removeItem('otpSentAt')

          //setSubmittedEmail(null)
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
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
  }


  async function updateSignature(base64: string) {
    if (!user) return
    const { signature } = await authApi.updateSignature(base64)
    setUser({ ...user, signature })  // now holds base64 JPEG
  }



  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        submitEmail,
        verifyOtp,
        logout,
        secondsLeft,
        submittedEmail,

        updateSignature
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