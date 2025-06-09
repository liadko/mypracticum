package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"mypracticum/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RegisterEntriesRoutes mounts all /students/:studentId/entries paths
func RegisterEntriesRoutes(r *gin.Engine, db *sql.DB) {
	r.GET("/students/:studentId/entries", getAll(db))
	r.POST("/students/:studentId/entries/personal", addPersonal(db))
	r.DELETE("/students/:studentId/entries/personal/:entryId", delPersonal(db))
	// add mentor/client routes similarly…
}

func getAll(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentId := c.Param("studentId")
		// TODO: load from DB into slices of models.PersonalEntry, MentorEntry, ClientEntry
		c.JSON(http.StatusOK, gin.H{
			"personal": []models.PersonalEntry{},
			"mentor":   []models.MentorEntry{},
			"clients":  []models.ClientEntry{},
		})
	}
}

func addPersonal(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentId := c.Param("studentId")
		var req struct {
			Date string `json:"date"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if _, err := time.Parse("2006-01-02", req.Date); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "date must be YYYY-MM-DD"})
			return
		}
		newEntry := models.PersonalEntry{
			ID:   uuid.NewString(),
			Date: req.Date,
		}
		// TODO: INSERT into DB
		c.JSON(http.StatusCreated, newEntry)
	}
}

func delPersonal(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		entryId := c.Param("entryId")
		// TODO: DELETE FROM …
		c.Status(http.StatusNoContent)
	}
}
