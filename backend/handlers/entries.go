package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"mypracticum/backend/models"

	"github.com/gin-gonic/gin"
)

// RegisterEntriesRoutes mounts all new generic entry routes.
func RegisterEntriesRoutes(r *gin.Engine, db *sql.DB) {
	// The route group for a specific student's entries.
	entries := r.Group("/api/:studentId/entries")
	{
		// NEW: Specific GET routes for each category.
		entries.GET("/personal", getPersonalEntries(db))
		entries.GET("/mentor", getMentorEntries(db))
		entries.GET("/client", getClientEntries(db))

		// These routes for creating, updating, and deleting can remain generic.
		entries.POST("/:category", addEntry(db))
		entries.PATCH("/:category/:entryId", updateEntry(db))
		entries.DELETE("/:category/:entryId", delEntry(db))
	}
}

// getClientEntries fetches all client entries for a student after looking up the user's UUID.
func getClientEntries(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {

		// --- Step 1: Look up UserUUID
		userUUID, ok := getUserUUID(c, db)
		if !ok {
			return // Stop execution
		}

		// --- Step 2: Use the found UserUUID to fetch the entries ---
		entriesQuery := `
			SELECT id, date, COALESCE(client_name, '') 
			FROM entries 
			WHERE user_id = $1 AND type = 'client' 
			ORDER BY date DESC
		`
		rows, err := db.QueryContext(c, entriesQuery, userUUID)
		if err != nil {
			log.Printf("Error querying client entries for user_id %s: %v", userUUID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve entries"})
			return
		}
		defer rows.Close()

		entries := []models.ClientEntry{}
		for rows.Next() {
			var entry models.ClientEntry
			var entryDate time.Time // Scan directly into time.Time for correct handling

			if err := rows.Scan(&entry.ID, &entryDate, &entry.ClientName); err != nil {
				log.Printf("Error scanning client entry row: %v", err)
				continue // Skip bad rows and continue
			}

			// Format the date to the "YYYY-MM-DD" string your frontend expects
			entry.Date = entryDate.Format("2006-01-02")

			entries = append(entries, entry)
		}

		// Final check for errors during row iteration
		if err = rows.Err(); err != nil {
			log.Printf("Error iterating client entry rows: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process entries"})
			return
		}

		c.JSON(http.StatusOK, entries)
	}
}

// getPersonalEntries returns an empty list of personal entries.
func getPersonalEntries(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// --- Step 1: Look up UserUUID
		userUUID, ok := getUserUUID(c, db)
		if !ok {
			return // Stop execution
		}

		// --- Step 2: Use the found UserUUID to fetch the entries ---
		entriesQuery := `
			SELECT id, date, external_therapist_id
			FROM entries 
			WHERE user_id = $1 AND type = 'personal' 
			ORDER BY date DESC
		`
		rows, err := db.QueryContext(c, entriesQuery, userUUID)
		if err != nil {
			log.Printf("Error querying personal entries for user_id %s: %v", userUUID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve entries"})
			return
		}
		defer rows.Close()

		entries := []models.PersonalEntry{}
		for rows.Next() {
			var entry models.PersonalEntry
			var entryDate time.Time

			if err := rows.Scan(&entry, &entryDate, entry.ExternalTherapistID); err != nil {
				log.Printf("Error scanning personal entry row: %v", err)
				continue // Skip bad rows and continue
			}

			entry.Date = entryDate.Format("2006-01-02")

			entries = append(entries, entry)
		}

		// Final check for errors during row iteration
		if err = rows.Err(); err != nil {
			log.Printf("Error iterating client entry rows: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process entries"})
			return
		}

		c.JSON(http.StatusOK, entries)
	}
}

// getMentorEntries returns an empty list of mentor entries.
func getMentorEntries(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// This handler also returns an empty slice as a placeholder.
		c.JSON(http.StatusOK, []models.MentorEntry{})
	}
}

// addEntry adds a new entry to the specified category.
func addEntry(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		category := c.Param("category")

		userUUID, ok := getUserUUID(c, db)
		if !ok {
			return // Stop execution
		}

		var req struct {
			Date string `json:"date" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if _, err := time.Parse("2006-01-02", req.Date); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "date must be YYYY-MM-DD"})
			return
		}

		// FIX: Using correct column names `user_id`, `date`, and `type`.
		query := `INSERT INTO entries (user_id, date, type) VALUES ($1, $2, $3) RETURNING id`

		var newId string
		err := db.QueryRowContext(c, query, userUUID, req.Date, category).Scan(&newId)
		if err != nil {
			log.Printf("Error inserting new entry: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create new entry"})
			return
		}

		// Return the correct new entry model based on the category
		// This is important for the frontend's optimistic UI reconciliation.
		switch category {
		case "personal":
			c.JSON(http.StatusCreated, models.PersonalEntry{ID: newId, Date: req.Date})
		case "mentor":
			c.JSON(http.StatusCreated, models.MentorEntry{ID: newId, Date: req.Date})
		case "client":
			c.JSON(http.StatusCreated, models.ClientEntry{ID: newId, Date: req.Date, ClientName: ""})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		}
	}
}

// delEntry deletes an entry from a specified category.
func delEntry(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		entryId := c.Param("entryId")

		// Look up the user's UUID to ensure the user owns this entry.
		userUUID, ok := getUserUUID(c, db)
		if !ok {
			return // Stop execution
		}

		// Perform the delete, ensuring the entry belongs to the correct user.
		query := `DELETE FROM entries WHERE id = $1 AND user_id = $2`

		result, err := db.ExecContext(c, query, entryId, userUUID)
		if err != nil {
			log.Printf("Error deleting entry: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete entry"})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			// This means the entry didn't exist or didn't belong to the user.
			c.Status(http.StatusNotFound)
			return
		}

		c.Status(http.StatusNoContent)
	}
}

// updateEntry handles PATCH requests to update a specific field of an entry.
func updateEntry(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		category := c.Param("category")
		entryId := c.Param("entryId")

		userUUID, ok := getUserUUID(c, db)
		if !ok {
			return // Stop execution
		}

		switch category {
		case "clients":
			var req struct {
				ClientName string `json:"clientName"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Update the entry, ensuring it belongs to the correct user.
			query := `
				UPDATE entries SET client_name = $1 
				WHERE id = $2 AND user_id = $3
				RETURNING id, date, client_name
			`

			var updatedEntry models.ClientEntry
			var entryDate time.Time

			err := db.QueryRowContext(c, query, req.ClientName, entryId, userUUID).Scan(&updatedEntry.ID, &entryDate, &updatedEntry.ClientName)
			if err != nil {
				if err == sql.ErrNoRows {
					// The entry was not found for this user.
					c.JSON(http.StatusNotFound, gin.H{"error": "entry not found for this user"})
					return
				}
				log.Printf("Error updating client entry: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update client entry"})
				return
			}

			updatedEntry.Date = entryDate.Format("2006-01-02")

			c.JSON(http.StatusOK, updatedEntry)

		// Add cases for "mentor" or "personal" here as they become editable.
		default:
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found or not updatable"})
		}
	}
}

// getUserUUID is a helper function to look up a user's UUID by their student ID string.
// It handles writing the error response to the context if the user is not found.
func getUserUUID(c *gin.Context, db *sql.DB) (string, bool) {
	studentIdStr := c.Param("studentId")

	var userUUID string
	query := `SELECT id FROM users WHERE student_id = $1`
	err := db.QueryRowContext(c, query, studentIdStr).Scan(&userUUID)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		} else {
			log.Printf("Error looking up user by student_id %s: %v", studentIdStr, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}
		return "", false // Indicate failure
	}

	return userUUID, true // Indicate success
}
