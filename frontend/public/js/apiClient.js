// --- CONFIGURATION ---
// This is what was in your application.properties
// It's the base URL of your *Go backend*.
const API_BASE_URL = 'https://mypracticum-backend-1036236504607.me-west1.run.app/api/v1'; // Or your production URL

// This is the JWT you were injecting with Feign
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYmM4MDU4YjItZWU4Yy00YzNmLWFmNDUtYTZiMDQwODhhZmEwIiwicm9sZXMiOlsic3R1ZGVudCIsIm1lbnRvciIsImFkbWluIl0sImlzcyI6Im15cHJhY3RpY3VtIiwiZXhwIjoxNzcxMTc2MzA5LCJpYXQiOjE3NjI1MzYzMDl9.0mkdRqxceg8AjDokS40kSLAvFgTagDakgsoJk0w4qaU';
// ---------------------

/**
 * A central fetch function that automatically adds the JWT header
 * and handles JSON parsing and errors.
 * This replaces your Feign client.
 * @param {string} endpoint The API endpoint (e.g., '/admin/students')
 * @param {object} options The standard 'fetch' options object
 */
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Create headers and add the Authorization token
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${JWT}`);

    // Set content-type for JSON, but not for FormData
    if (options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(url, config);

    // Check if the response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (!response.ok) {
            // Throw an error with the server's message
            throw new Error(data.error || `Request failed: ${response.status}`);
        }
        return data; // Success
    }

    // Handle non-JSON responses (like plain text or errors)
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Server Error (${response.status}): ${text}`);
    }
    return text; // Success (though less common)
}

// --- Export a function for each API call ---
// These match your PracticumApiClient interface

export function importStudents(file, isDryRun) {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `/admin/students/import?dryRun=${isDryRun}`;

    return fetchApi(endpoint, {
        method: 'POST',
        body: formData
        // Note: We don't set Content-Type for FormData
    });
}

export function approveEntries(ids) {
    return fetchApi('/admin/entries/approve', {
        method: 'POST',
        body: JSON.stringify({ ids }) // {approved:true} is default in Go
    });
}

export function getStudents() {
    return fetchApi('/admin/students'); // GET is the default method
}

export function bulkAddManualEntries(entriesPayload) {
    const payload = { entries: entriesPayload };
    return fetchApi('/admin/entries/manual', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function deleteManualEntries(ids) {
    return fetchApi('/admin/entries/manual/delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
    });
}