import { getApiBaseUrl, getJwtToken } from './apiConfig';

/**
 * Shared authenticated fetch wrapper handling JWT headers, status checks, and error formatting.
 */
export async function fetchWithAuth<T>(
  endpoint: string,
  queryParams?: Record<string, string | number | boolean | undefined | null>
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getJwtToken();

  const urlObj = new URL(`${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, window.location.origin);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        urlObj.searchParams.append(key, String(val));
      }
    });
  }

  let response: Response;
  try {
    response = await fetch(urlObj.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err: any) {
    throw new Error(`שגיאת תקשורת: השרת אינו זמין או מנותק (${err.message || 'Network error'})`);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`שגיאת הרשאה (${response.status} Unauthorized). אנא עדכן את טוקן ה-JWT.`);
    }
    if (response.status === 404) {
      throw new Error(`המשאב המבוקש לא נמצא בשרת (${response.status} Not Found).`);
    }
    throw new Error(`תגובת שרת לא תקינה (${response.status} ${response.statusText})`);
  }

  return (await response.json()) as T;
}
