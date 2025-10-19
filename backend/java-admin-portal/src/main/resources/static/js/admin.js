// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {

    // Get elements from the page
    const importForm = document.getElementById('import-form');
    const fileInput = document.getElementById('file-input');
    const dryRunCheck = document.getElementById('dry-run-check');
    const importButton = document.getElementById('import-button');
    const logOutput = document.getElementById('log-output');

    const approveForm = document.getElementById('approve-form');
    const approveIdsInput = document.getElementById('approve-ids-input');
    const approveButton = document.getElementById('approve-button');

    // --- Attach Event Listener for Student Import ---
    if (importForm) {
        importForm.addEventListener('submit', handleImportSubmit);
    }
    if (approveForm) {
        approveForm.addEventListener('submit', handleApproveSubmit);
    }

    /**
     * Handles the submission of the student import form.
     */
    async function handleImportSubmit(event) {
        event.preventDefault(); // Stop the form from submitting the traditional way

        const file = fileInput.files[0];
        if (!file) {
            logMessage('Error: No file selected.');
            return;
        }

        const isDryRun = dryRunCheck.checked;
        const formData = new FormData();
        formData.append('file', file);

        // Build the URL with the dryRun query parameter
        const url = `/admin-portal/students/import?dryRun=${isDryRun}`;

        logMessage('Uploading file... (Dry Run: ' + isDryRun + ')');
        importButton.disabled = true; // Disable button during upload
        importButton.textContent = 'Processing...';

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
                // No 'Content-Type' header needed;
                // browser sets it automatically for FormData
            });

            // Check if the response is JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const result = await response.json();

                if (response.ok) {
                    logMessage('SUCCESS: Import complete.');
                    logMessage(JSON.stringify(result, null, 2));
                } else {
                    // Handle backend errors (like 400, 500)
                    logMessage(`ERROR (${response.status}): ${result.error}`);
                    if (result.details) {
                        logMessage(`Details: ${JSON.stringify(result.details, null, 2)}`);
                    }
                }
            } else {
                // Handle non-JSON responses (e.g., HTML error pages)
                const text = await response.text();
                logMessage(`ERROR (${response.status}): Unexpected response from server.`);
                logMessage(text);
            }

        } catch (error) {
            // Handle network errors
            logMessage('FATAL ERROR: Could not connect to the server.');
            logMessage(error.message);
        } finally {
            // Re-enable the button
            importButton.disabled = false;
            importButton.textContent = 'Upload and Process';
        }
    }

    async function handleApproveSubmit(event) {
        event.preventDefault();

        const raw = (approveIdsInput.value || '').trim();
        if (!raw) {
            logMessage('Error: No IDs provided.');
            return;
        }

        // split by any whitespace/newlines/commas/semicolons; dedupe
        const ids = Array.from(new Set(raw.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)));

        // quick UUID sanity check (reject obvious typos early)
        const invalid = ids.filter(s => !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s));
        if (invalid.length) {
            logMessage(`Error: Invalid UUIDs (${invalid.length}): ${invalid.slice(0,5).join(', ')}${invalid.length>5?' …':''}`);
            return;
        }

        const url = '/admin-portal/entries/approve'; // adjust if your backend route differs
        approveButton.disabled = true;
        approveButton.textContent = 'Approving…';
        logMessage(`Approving ${ids.length} entries…`);

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }) // {approved:true} is default server-side
            });

            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await resp.json();
                if (resp.ok) {
                    logMessage('SUCCESS: Bulk approval complete.');
                    logMessage(JSON.stringify(data, null, 2));
                } else {
                    logMessage(`ERROR (${resp.status}): ${data.error || 'request failed'}`);
                    if (data.details) logMessage(`Details: ${JSON.stringify(data.details, null, 2)}`);
                }
            } else {
                const text = await resp.text();
                logMessage(`ERROR (${resp.status}): Unexpected response from server.`);
                logMessage(text);
            }
        } catch (e) {
            logMessage('FATAL ERROR: Could not reach server.');
            logMessage(e.message);
        } finally {
            approveButton.disabled = false;
            approveButton.textContent = 'Approve Listed Entries';
        }
    }


    /**
     * A helper function to print messages to the log box on the page.
     * @param {string} message - The message to log.
     */
    function logMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        logOutput.textContent = `[${timestamp}] ${message}\n` + logOutput.textContent;
    }

});