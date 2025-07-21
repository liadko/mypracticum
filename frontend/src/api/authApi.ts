import type { User } from "../types"
import { fetchWithTimeout } from "../utils/fetchWithTimeout"
import { apiFetch } from "./client"
import { AuthError } from "./errors"

/**
 * Trigger sending an OTP to the given email.
 */
export async function login(email: string): Promise<void> {
  let res: Response
  try {
    res = await fetchWithTimeout('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }, 3000)
  } catch {
    throw new AuthError('network', 'יש בעיה ברשת')
  }
  if (!res.ok) {
    if (res.status === 400) throw new AuthError('invalid-email', 'כתובת מייל לא תקינה')
    if (res.status === 404) throw new AuthError('invalid-email', 'המייל אינו קיים במערכת')
    if (res.status === 429) throw new AuthError('too-many-requests', 'נא להמתין, נסו שוב בקרוב')
    throw new AuthError('network', `login failed: ${res.status}`)
  }

}

/**
 * Verify the OTP and return a fresh JWT.
 */
export async function verifyOtp(
  email: string,
  code: string
): Promise<{ token: string }> {
  const res = await fetch('/api/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  if (!res.ok) {
    if (res.status === 429) throw new AuthError('too-many-requests', 'נא להמתין בין בדיקות')
    if (res.status === 401) throw new AuthError('invalid-code', 'קוד שגוי, נסו שנית')
    throw new AuthError('network', `OTP verification failed: ${res.status}`)
  }
  return await res.json()
}

/**
 * Fetch the current user’s profile.
 */
export async function fetchProfile(): Promise<User> {
  const res = await apiFetch('/api/users/me')
  if (!res.ok) {
    console.error(`got this: ${res}`)
    throw new Error(`fetchProfile failed: ${res.status}`)
  }
  return await res.json()
}