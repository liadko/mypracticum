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

/** The server's message when an action was refused because a student is frozen. */
export function frozenMessage(err: unknown): string | null {
  return err instanceof HttpError && err.data?.code === 'student_frozen' ? err.message : null
}

/** Builds an HttpError from a failed response, keeping the server's message. */
export async function httpErrorFrom(res: Response): Promise<HttpError> {
  const data = await res.json().catch(() => null)
  return new HttpError(data?.error || res.statusText, res.status, data)
}

export class HttpError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}