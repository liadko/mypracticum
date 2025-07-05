
export interface User {
  id: string
  name: string
  email: string
  role: string
}

/**
 * Trigger sending an OTP to the given email.
 */
export async function login(email: string): Promise<void> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    throw new Error(`login failed: ${res.status}`)
  }
}

/**
 * Verify the OTP and return a fresh JWT.
 */
export async function verifyOtp(
  email: string,
  code: string
): Promise<{ token: string }> {
  const res = await fetch('/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  if (!res.ok) {
    throw new Error(`OTP verification failed: ${res.status}`)
  }
  return await res.json()
}

/**
 * Fetch the current user’s profile.
 */
export async function fetchProfile(token: string): Promise<User> {
  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`fetchProfile failed: ${res.status}`)
  }
  return await res.json()
}