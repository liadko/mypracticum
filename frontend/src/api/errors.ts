export type AuthErrorCode = 
  | 'invalid-email'
  | 'invalid-code'
  | 'too-many-requests'
  | 'network'

export class AuthError extends Error {
  public code: AuthErrorCode

  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.code = code

    // fix the prototype chain (for instanceof to work)
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}


export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message)
    this.name = 'TimeoutError'
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}