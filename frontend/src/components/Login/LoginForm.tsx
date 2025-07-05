
import './LoginPage.css'


export interface LoginFormProps {
  /** Called with the user’s email when the form is submitted */
  onSubmit: (email: string) => Promise<void>
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  // TODO: render an email input and submit button
  return <>
  Dad's Login Page!
  </>
}