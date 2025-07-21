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
  //const navigate = useNavigate()
  const { user, submitEmail, verifyOtp, secondsLeft, submittedEmail } = useAuth()

  const [otpPage, setOtpPage] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Redirect on successful auth
  // useEffect(() => {
  //   if (user) {
  //     const homePath = user.role === 'mentor' ? '/mentor' : '/'
  //     navigate(homePath, { replace: true })
  //   }
  // }, [user, navigate])


  // Handle email submission
  const handleEmailSubmit = async (enteredEmail: string) => {
    // if they just re-submit the same email, jump straight to OTP step
    if (enteredEmail === submittedEmail) {
      setOtpPage(true)
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
      setOtpPage(true)
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
    } catch (err : unknown) {
      if(err instanceof AuthError)
        showError(err.message, 2000)
      else
        showError('בדיקות הקוד נכשלה. צרו קשר אם הבעיה מתמשכת')
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
          {otpPage && (
            <button
              className="login-modal__close"
              onClick={() => setOtpPage(false)}
              aria-label="Close"
            >
              ×
            </button>
          )}
          <img src="/logo.png" alt="לוגו" className="login-modal__logo" />
          <h1 className="login-modal__title">
            {otpPage ? 'הכנס קוד אימות' : 'ברוכים הבאים לתמורות פרקטיקום'}
          </h1>
        </div>

        <div className="login-modal__body">
          {!otpPage ? (
            <LoginForm onSubmit={handleEmailSubmit} disabled={loading} previouslySubmittedEmail={submittedEmail ?? ""} secondsLeft={secondsLeft}/>
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
