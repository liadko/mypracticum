
import './LoginPage.css'


export interface OtpFormProps {
  /** The email address we sent the code to */
  email: string
  /** Called with the OTP code when the form is submitted */
  onSubmit: (code: string) => Promise<void>
}

export default function OtpForm({ email, onSubmit }: OtpFormProps) {
  // TODO: render a code input and submit button
  return <>
    me bruddah
  </>
}