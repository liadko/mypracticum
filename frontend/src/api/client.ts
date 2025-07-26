export async function apiFetch(url: string, options: RequestInit = {}) {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('token');

    // 2. Clone headers and add the Authorization header if the token exists
    const headers = new Headers(options.headers);
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }
    // Ensure we always send JSON
    headers.append('Content-Type', 'application/json');


    // 3. Make the request with the new headers
    const res = await fetch(url, {
        ...options,
        headers,
    });

    // 4. Centralized error handling for unauthorized requests
    if (res.status === 401) {
        // Optional: clear the token and reload to force the user to the login page
        localStorage.removeItem('token');
        window.location.reload(); 
        // Or dispatch a custom event that AuthContext can listen for
        // window.dispatchEvent(new Event('auth-error'));
        console.error("Unauthorized")
        throw new Error('Unauthorized');
    }

    return res

}
