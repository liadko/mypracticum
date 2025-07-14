export async function fetchWithTimeout(
  input: RequestInfo,          // URL string or Request object
  init: RequestInit = {},      // your usual fetch options
  timeoutMs: number = 5000     // how many milliseconds before abort
): Promise<Response> {
  const controller = new AbortController()
  const id = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(id)
  }
}
