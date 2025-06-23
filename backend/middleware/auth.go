package middleware

import (
	"database/sql"
	"errors"
	"mypracticum/backend/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authSvc *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentID := c.Param("studentId")

		userID, err := authSvc.ResolveUserID(c.Request.Context(), studentID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "student not found"})
			} else {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "user lookup failed"})
			}
			return
		}

		// inject into context for handlers
		c.Set("userID", userID)
		c.Next()
	}
}
