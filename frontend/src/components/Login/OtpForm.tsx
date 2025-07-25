import { useState, type FormEvent } from 'react'
import './LoginPage.css'

export interface OtpFormProps {
  /** The email address we sent the code to */
  email: string
  /** Called with the OTP code when the form is submitted */
  onSubmitOtp: (code: string) => Promise<void>
  /** Disable input and button while verifying */
}

export default function OtpForm({
  email,
  onSubmitOtp,
}: OtpFormProps) {
  const [code, setCode] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length < 6) return
    await onSubmitOtp(code)
  }

  return (
    <>


      <form className="login-form" onSubmit={handleSubmit} noValidate>

        <p className="login-form__info" dir="rtl">
          הכניסו כאן את קוד האימות שנשלח אל <br /> {email}
        </p>
        <input
          id="otp_form_input"
          type="text"
          className="login-form__input otp-input"
          placeholder="_  _  _  _  _  _"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          //disabled={disabled}
        />

        <button
          type="submit"
          className="login-form__button"
          disabled={code.length < 6}
        >
          אשרו את הקוד
        </button>
      </form>
    </>
  )
}
