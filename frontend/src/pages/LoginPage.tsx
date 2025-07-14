import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/Login/LoginForm'
import OtpForm from '../components/Login/OtpForm'
import '../components/Login/LoginPage.css'
import { showError, showSuccess } from '../utils/toast'
import { isValidEmail } from '../domain/user'
import { AuthError } from '../api/errors'


export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, submitEmail, verifyOtp, secondsLeft, submittedEmail } = useAuth()

  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Redirect on successful auth
  useEffect(() => {
    if (isAuthenticated && user) {
      const homePath = user.role === 'mentor' ? '/mentor' : '/'
      navigate(homePath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])


  useEffect(() => {
    if (secondsLeft == 0 || !submittedEmail) {
      setOtpSent(false)
      console.log("kicking user out to main screen")
    }
  }, [secondsLeft, submittedEmail, otpSent])


  // Handle email submission
  const handleEmailSubmit = async (enteredEmail: string) => {
    // if they just re-submit the same email, jump straight to OTP step
    if (enteredEmail === submittedEmail) {
      setOtpSent(true)
      return
    }


    if (secondsLeft > 0) {
      showError("נא להמתין")
      return
    }

    if (!isValidEmail(enteredEmail)) {
      showError("נא להקליד מייל תקין")
      return
    }


    setLoading(true)
    try {
      await submitEmail(enteredEmail)
      setOtpSent(true)
      showSuccess("קוד נשלח בהצלחה", 4000)
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        // show the API‐provided error text
        showError(err.message)
      } else {
        console.error('Unexpected submitEmail error', err)
        showError('שליחת הקוד נכשלה. נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP verification
  const handleOtpSubmit = async (code: string) => {
    setLoading(true)
    try {
      await verifyOtp(code)
    } catch {
      showError('קוד שגוי. בדוק ונסה שוב', 2000)
      setLoading(false)
    }
  }

  // format mm:ss
  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="login-page">
      <div className="login-modal">
        <div className="login-modal__header">
          {otpSent && (
            <button
              className="login-modal__close"
              onClick={() => setOtpSent(false)}
              aria-label="Close"
            >
              ×
            </button>
          )}
          <img src="/logo.png" alt="לוגו" className="login-modal__logo" />
          <h1 className="login-modal__title">
            {otpSent ? 'הכנס קוד אימות' : 'ברוכים הבאים לתמורות פרקטיקום'}
          </h1>
        </div>

        <div className="login-modal__body">
          {!otpSent ? (
            <LoginForm onSubmit={handleEmailSubmit} disabled={loading} previouslySubmittedEmail={submittedEmail ?? ""} />
          ) : (
            <OtpForm
              email={submittedEmail!}
              onSubmitOtp={handleOtpSubmit}
              disabled={loading}
            />
          )}



        </div>
        {/* countdown / resend notice */}
        {secondsLeft > 0 && (
          <div className="login-modal__timer">
            ניתן לבקש קוד חדש בעוד {fmt(secondsLeft)}
          </div>
        )}
      </div>
    </div>
  )
}
