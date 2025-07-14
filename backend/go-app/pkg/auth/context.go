package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetUserID extracts the uuid.UUID set by JWTMiddleware.
// If it’s missing or the wrong type, it aborts the request
// with the proper status (401 or 500) and returns (uuid.Nil, false).
func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	raw, ok := c.Get("userID")
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return uuid.Nil, false
	}
	uid, ok := raw.(uuid.UUID)
	if !ok {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return uuid.Nil, false
	}
	return uid, true
}
