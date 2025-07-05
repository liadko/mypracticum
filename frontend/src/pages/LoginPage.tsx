import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/Login/LoginForm'
import OtpForm from '../components/Login/OtpForm'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, login, verifyOtp } = useAuth()

  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // as soon as we have a user, jump to their home
  useEffect(() => {
    if (isAuthenticated && user) {
      const homePath = user.role === 'mentor'
        ? '/mentor'    // future mentor dashboard
        : '/'          // student desktop app
      navigate(homePath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])


  return (
    <div className='login-page'>
      <div className='login-modal'>

        {/* step 1: email entry */}

        {!otpSent && <LoginForm
          onSubmit={async (enteredEmail) => {
            await login(enteredEmail)
            setEmail(enteredEmail)
            setOtpSent(true)
          }}
        />}

        {/* step 2: OTP entry */}
        {otpSent && <OtpForm
          email={email}
          onSubmit={async (code) => {
            await verifyOtp(email, code)
          }}
        />}
      </div>
    </div>
  )
}