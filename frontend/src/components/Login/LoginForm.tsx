import { useEffect, useState, type FormEvent } from 'react'
import './LoginPage.css'

export interface LoginFormProps {
  /** Called with the user’s email when the form is submitted */
  onSubmit: (email: string) => void
  disabled?: boolean
  previouslySubmittedEmail: string
  secondsLeft: number
}

export default function LoginForm({ onSubmit, disabled = false, previouslySubmittedEmail = '', secondsLeft=0 }: LoginFormProps) {
  const [email, setEmail] = useState(previouslySubmittedEmail)
  const [touched, setTouched] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!email) return
    onSubmit(email)
  }

  // // if parent changes it (e.g. after refresh), keep in sync:
  // useEffect(() => {
  //   setEmail(previouslySubmittedEmail)
  // }, [previouslySubmittedEmail])

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <p className="login-form__info" dir="rtl">
        הכניסו את כתובת הדוא״ל שלכם,<br />ונשלח אליכם קוד אימות לכניסה
      </p>
      <input
        type="email"
        className="login-form__input"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        required
      />
      <button
        type="submit"
        className="login-form__button"
        disabled={!email.trim()}
      >
        {previouslySubmittedEmail && email == previouslySubmittedEmail && secondsLeft > 0
          ? "הכנסת הקוד"
          : "שלחו לי קוד אימות"}

      </button>
    </form>
  )
}
