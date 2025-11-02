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

    // --- NEW ELEMENTS FOR GROUP CREATION ---
    const createGroupForm = document.getElementById('create-group-form');
    const groupTitleInput = document.getElementById('group-title-input');
    const groupTypeSelect = document.getElementById('group-type-select');
    const studentSearchInput = document.getElementById('student-search-input');
    const studentListContainer = document.getElementById('student-list-container');
    const createGroupButton = document.getElementById('create-group-button');

    const deleteManualForm = document.getElementById('delete-manual-form');
    const deleteManualIdsInput = document.getElementById('delete-manual-ids-input');
    const deleteManualButton = document.getElementById('delete-manual-button');

    let allStudents = [];

    // --- Attach Event Listener for Student Import ---
    if (importForm) {
        importForm.addEventListener('submit', handleImportSubmit);
    }
    if (approveForm) {
        approveForm.addEventListener('submit', handleApproveSubmit);
    }
    if (createGroupForm) {
        // Handle form submission
        createGroupForm.addEventListener('submit', handleGroupSubmit);

        // Handle live searching in the student list
        studentSearchInput.addEventListener('input', handleStudentSearch);

        studentSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
    if (deleteManualForm) {
        deleteManualForm.addEventListener('submit', handleDeleteManualSubmit);
    }

    // --- Tab Switching Logic ---
    const tabContainer = document.querySelector('.tab-nav');
    const tabButtons = document.querySelectorAll('.tab-button');
    const adminPages = document.querySelectorAll('.admin-page');

    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            const clickedButton = e.target.closest('.tab-button');
            if (!clickedButton) return; // Exit if they clicked the nav background

            // Get the ID of the page to show
            const targetId = clickedButton.dataset.target;
            const targetPage = document.getElementById(targetId);

            if (targetPage) {
                // 1. Remove 'active' from all buttons and pages
                tabButtons.forEach(btn => btn.classList.remove('active'));
                adminPages.forEach(page => page.classList.remove('active'));

                // 2. Add 'active' to the clicked button and target page
                clickedButton.classList.add('active');
                targetPage.classList.add('active');
            }
        });
    }

    loadInitialData();


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
        if (!isDryRun) {
            const confirmMsg = "This is a LIVE import and will create students in the database.\n\nAre you sure you want to continue? Did you run a Test Run first?";

            if (!window.confirm(confirmMsg)) {
                logMessage("Import canceled by user.");
                return;
            }
        }


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

                    // We check for 'failures' (from the bulk upsert) and 'parseWarnings' (from the CSV parser)
                    const errors = result.errors || [];
                    const warnings = result.parseWarnings || [];

                    if (isDryRun && result.failures == 0 && errors.length === 0 && warnings.length === 0) {
                        // This is the success alert you requested
                        window.alert("בדיקת היבוא הסתיימה בהצלחה!\n\nלא נמצאו שגיאות. אפשר להוריד את הסימון 'Test Run' ולהעלות את הקובץ בבטחה.");
                    }
                    else
                    {
                        window.alert("נמצאו בעיות במהלך בדיקת היבוא.\n\nבדוק את יומן ההודעות לפרטים נוספים.");

                    }
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
     * Fetches students from the server on page load.
     */
    async function loadInitialData() {
        try {
            logMessage('Loading initial data...');
            // Fetch students
            const studentResponse = await fetch('/admin-portal/students');

            if (!studentResponse.ok) {
                throw new Error(`Failed to load students: ${studentResponse.status}`);
            }
            allStudents = await studentResponse.json();
            // Store the initial checked state on the object itself
            allStudents.forEach(s => s.isSelected = false);
            renderStudents(allStudents); // Render all students initially
            logMessage(`Loaded ${allStudents.length} students.`);

        } catch (error) {
            logMessage(`FATAL ERROR: ${error.message}`);
            if (studentListContainer) studentListContainer.innerHTML = '<p class="loading-text">Error loading data</p>';
        }
    }


    /**
     * Renders the list of students into the container.
     * @param {Array} studentsToRender - The list of student objects to display.
     */
    function renderStudents(studentsToRender) {
        if (!studentListContainer) return;

        studentListContainer.innerHTML = ''; // Clear the list

        if (studentsToRender.length === 0) {
            studentListContainer.innerHTML = '<p class="loading-text">No students found matching search.</p>';
            return;
        }

        studentsToRender.forEach(student => {
            const item = document.createElement('div');
            item.className = 'student-list-item';

            // We will store the student's ID on the checkbox
            item.innerHTML = `
                <input type="checkbox" 
                       class="student-select-check" 
                       data-id="${student.id}"
                       ${student.isSelected ? 'checked' : ''}>
                
                <div class="student-info">
                    <div class="name">${student.firstName} ${student.lastName}</div>
                    <div class="email">${student.email}</div>
                    <div class="uuid">${student.id}</div>
                </div>
                
                <input type="number" 
                       class="student-hours-input" 
                       placeholder="Hrs" 
                       value="${student.hoursAssigned || ''}"
                       ${student.isSelected ? '' : 'disabled'}>
            `;

            // --- Add event listeners for this new row ---
            const checkbox = item.querySelector('.student-select-check');
            const hoursInput = item.querySelector('.student-hours-input');

            // 1. Toggle the 'disabled' state of the hours input
            checkbox.addEventListener('change', () => {
                const studentId = checkbox.dataset.id;
                // Find the student in our main array to update its state
                const studentInState = allStudents.find(s => s.id === studentId);

                if (checkbox.checked) {
                    hoursInput.disabled = false;
                    studentInState.isSelected = true;
                    // Default to 10 hours if it's empty
                    if (!hoursInput.value) {
                        hoursInput.value = 10;
                        studentInState.hoursAssigned = 10;
                    }
                } else {
                    hoursInput.disabled = true;
                    studentInState.isSelected = false;
                }
            });

            // 2. Update the state when hours are changed
            hoursInput.addEventListener('input', () => {
                const studentId = checkbox.dataset.id;
                const studentInState = allStudents.find(s => s.id === studentId);
                studentInState.hoursAssigned = parseInt(hoursInput.value) || 0;
            });

            studentListContainer.appendChild(item);
        });
    }

    /**
     * Handles the 'input' event on the student search bar.
     * When cleared, it re-sorts the list to show selected students first.
     */
    function handleStudentSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();

        // If search is empty, show all students, with selected ones on top
        if (!searchTerm) {
            // Create a sorted copy
            const sortedList = [...allStudents].sort((a, b) => {
                // 1. Primary sort: selected status (selected ones on top)
                if (a.isSelected && !b.isSelected) {
                    return -1; // a comes first
                }
                if (!a.isSelected && b.isSelected) {
                    return 1; // b comes first
                }

                // 2. Secondary sort: alphabetical by last name (if status is the same)
                const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
                const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();

                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });

            renderStudents(sortedList);
            return;
        }

        // --- Filter logic remains the same ---
        // Filter the main list
        const filteredStudents = allStudents.filter(student => {
            const name = `${student.firstName} ${student.lastName}`.toLowerCase();
            const email = student.email.toLowerCase();
            const id = student.id.toLowerCase();
            return name.includes(searchTerm) ||
                email.includes(searchTerm) ||
                id.includes(searchTerm);
        });

        // We do NOT sort the filtered list, as it would
        // be confusing while the user is actively searching.
        renderStudents(filteredStudents);
    }

    /**
     * Handles submission of the new group form.
     */
    async function handleGroupSubmit(event) {
        event.preventDefault();

        const titleAsCause = groupTitleInput.value.trim();
        const type = groupTypeSelect.value;

        if (!titleAsCause) {
            logMessage("Error: Please provide a Group Title to use as the 'cause'.");
            return;
        }

        if(!type) {
            logMessage("Error: Please select a Group Type.");
            return;
        }

        // Find all selected students *from the state*
        // This works even if they are hidden by the search filter
        const selectedStudents = allStudents
            .filter(student => student.isSelected)
            .map(student => ({
                studentId: student.id,
                hoursAssigned: parseInt(student.hoursAssigned) || 0
            }));

        if (selectedStudents.length === 0) {
            logMessage("Error: No students selected. Please check at least one student.");
            return;
        }

        // --- NEW ---
        // Transform the selected students into the
        // BulkAddManualEntriesRequest payload.
        const entriesPayload = selectedStudents.map(student => ({
            userId: student.studentId,
            hours: student.hoursAssigned,
            cause: titleAsCause,
            type: type
        }));

        const payload = {
            entries: entriesPayload
        };

        const confirmMsg = `Are you sure you want to add ${entriesPayload.length} manual entries?
        Cause: ${titleAsCause}
        Type: ${type}`;

        if (!window.confirm(confirmMsg)) {
            logMessage("Canceled by user.");
            return; // Stop the submission
        }

        // This is the new endpoint we created in the service
        const url = '/admin-portal/entries/manual';
        createGroupButton.disabled = true;
        createGroupButton.textContent = 'Adding Entries...';
        logMessage(`Adding ${entriesPayload.length} manual entries with cause: '${titleAsCause}'...`);

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await resp.json(); // This will be the BulkAddManualEntriesResult
                if (resp.ok) {
                    logMessage('SUCCESS: Bulk manual entry complete.');
                    logMessage(JSON.stringify(data, null, 2));
                    // reset the form after success
                    createGroupForm.reset();
                    allStudents.forEach(s => {
                       s.isSelected = false;
                       s.hoursAssigned = 0;
                    });
                    renderStudents(allStudents);
                } else {
                    logMessage(`ERROR (${resp.status}): ${data.error || 'request failed'}`);
                    if (data.failures) {
                        logMessage(`Details: ${JSON.stringify(data.failures, null, 2)}`);
                    } else if (data.details) {
                        logMessage(`Details: ${JSON.stringify(data.details, null, 2)}`);
                    }
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
            createGroupButton.disabled = false;
            createGroupButton.textContent = 'Add Manual Hours for Group';
        }
    }

    /**
     * Handles the submission of the delete manual entries form.
     */
    async function handleDeleteManualSubmit(event) {
        event.preventDefault();

        const raw = (deleteManualIdsInput.value || '').trim();
        if (!raw) {
            logMessage('Error: No IDs provided for deletion.');
            return;
        }

        // Parse IDs (same logic as approve)
        const ids = Array.from(new Set(raw.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)));

        // Quick UUID sanity check (good to keep)
        const invalid = ids.filter(s => !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s));
        if (invalid.length) {
            logMessage(`Error: Invalid UUIDs (${invalid.length}): ${invalid.slice(0,5).join(', ')}${invalid.length>5?' …':''}`);
            return;
        }

        // --- CRITICAL: Add confirmation for destructive action ---
        const confirmMsg = `Are you sure you want to permanently delete ${ids.length} entries/batches?

This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) {
            logMessage("Deletion canceled by user.");
            return;
        }
        // --- End of confirmation ---

        const url = '/admin-portal/entries/manual/delete';
        deleteManualButton.disabled = true;
        deleteManualButton.textContent = 'Deleting…';
        logMessage(`Sending ${ids.length} IDs for deletion…`);

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }) // Send the same { "ids": [...] } payload
            });

            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await resp.json();
                if (resp.ok) {
                    logMessage('SUCCESS: Deletion complete.');
                    logMessage(JSON.stringify(data, null, 2));
                    deleteManualIdsInput.value = ''; // Clear input on success
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
            deleteManualButton.disabled = false;
            deleteManualButton.textContent = 'Delete Listed Entries';
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