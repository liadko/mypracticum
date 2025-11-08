import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/Login/LoginForm'
import OtpForm from '../components/Login/OtpForm'
import '../components/Login/LoginPage.css'
import { showError, showSuccess } from '../utils/toast'
import { isValidEmail } from '../domain/user'
import { AuthError } from '../api/errors'


export default function LoginPage() {
  //const navigate = useNavigate()
  const { submitEmail, verifyOtp, secondsLeft, submittedEmail } = useAuth()

  const [isOtpPage, setIsOtpPage] = useState<boolean>(false)


  // Handle email submission
  const handleEmailSubmit = async (enteredEmail: string) => {
    // if they just re-submit the same email, jump straight to OTP step
    if (enteredEmail === submittedEmail && secondsLeft > 0) {
      setIsOtpPage(true)
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


    try {
      await submitEmail(enteredEmail)
      setIsOtpPage(true)
      showSuccess("קוד נשלח בהצלחה", 4000)
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        // show the API‐provided error text
        showError(err.message)
      } else {
        console.error('Unexpected submitEmail error', err)
        showError('שליחת הקוד נכשלה. נסה שוב')
      }
    }
  }

  // Handle OTP verification
  const handleOtpSubmit = async (code: string) => {
    //setLoading(true)
    try {
      await verifyOtp(code)
    } catch (err: unknown) {
      if (err instanceof AuthError)
        showError(err.message, 2000)
      else
        showError('בדיקות הקוד נכשלה. צרו קשר אם הבעיה מתמשכת')
      //setLoading(false)
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
          {isOtpPage && (
            <button
              className="login-modal__close"
              onClick={() => setIsOtpPage(false)}
              aria-label="Close"
            >
              ×
            </button>
          )}
          <img src="/logo.png" alt="לוגו" className="login-modal__logo" />
          <h1 className="login-modal__title">
            {isOtpPage ? 'הכנס קוד אימות' : 'ברוכים הבאים לתמורות פרקטיקום'}
          </h1>
        </div>

        <div className="login-modal__body">
          {!isOtpPage ? (
            <LoginForm onSubmit={handleEmailSubmit} previouslySubmittedEmail={submittedEmail ?? ""} secondsLeft={secondsLeft} />
          ) : (
            <OtpForm
              email={submittedEmail!}
              onSubmitOtp={handleOtpSubmit}
            />
          )}



        </div>
        {/* countdown / resend notice */}

        {isOtpPage
          ? (
            <div className="login-modal__resend">
              לא קיבלת קוד? <button className="login-modal__resend-button" onClick={() => setIsOtpPage(false)}>שלח שוב</button>
            </div>
          )
          : (secondsLeft > 0 &&
            <div className="login-modal__timer">
              ניתן לבקש קוד חדש בעוד {fmt(secondsLeft)}
            </div>
          )
        }
      </div>
    </div>
  )
}
