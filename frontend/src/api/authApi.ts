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
    res = await fetchWithTimeout('/api/v1/otp/send', {
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
  const res = await fetch('/api/v1/otp/verify', {
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
  const res = await apiFetch('/api/v1/users/me')
  if (!res.ok) {
    console.error(`got this: ${res}`)
    throw new Error(`fetchProfile failed: ${res.status}`)
  }
  return await res.json()
}

/**
 * updateSignature
 *
 * Sends a PATCH to `/api/users/me` with a JSON body containing
 * a Base64-encoded JPEG (no “data:” prefix). The server decodes
 * and stores the raw bytes, then echoes back the same Base64 string.
 *
 * @param base64JPEG  Base64 JPEG string (e.g. "iVBORw0KGgoAAAANS…"), without data URL header
 * @returns            Promise resolving to `{ signature: string }` where `signature`
 *                     is the saved Base64 JPEG
 * @throws             Error if the network call fails or the response is not OK
 */
export async function updateSignature(
  base64Jpeg: string
): Promise<{ signature: string }> {
  const res = await apiFetch('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature: base64Jpeg }),
  })
  if (!res.ok) throw new Error(`update failed: ${res.status}`)
  return res.json()  // { signature: "<base64-string>" }
}