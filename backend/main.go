package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Models
type PersonalEntry struct {
	ID                string `json:"id"`
	Date              string `json:"date"`
	ExternalTherapist *struct {
		Name string `json:"name"`
	} `json:"externalTherapist,omitempty"`
}

func main() {
	r := gin.Default()

	// GET all entries (personal/mentor/clients)
	r.GET("/students/:studentId/entries", func(c *gin.Context) {
		studentId := c.Param("studentId")
		_ = studentId

		// TODO: fetch slices from DB based on studentId
		c.JSON(http.StatusOK, gin.H{
			"personal": []PersonalEntry{},
			"mentor":   []any{},
			"clients":  []any{},
		})
	})

	// POST a new personal entry
	r.POST("/students/:studentId/entries/personal", func(c *gin.Context) {
		studentId := c.Param("studentId")
		_ = studentId

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

		// TODO: insert into DB, generate real ID
		newEntry := PersonalEntry{
			ID:                uuid.NewString(),
			Date:              req.Date,
			ExternalTherapist: nil,
		}
		c.JSON(http.StatusCreated, newEntry)
	})

	// DELETE a personal entry
	r.DELETE("/students/:studentId/entries/personal/:entryId", func(c *gin.Context) {
		entryId := c.Param("entryId")
		_ = entryId

		// TODO: delete from DB by entryId
		c.Status(http.StatusNoContent)
	})

	r.Run(":8080")
}
