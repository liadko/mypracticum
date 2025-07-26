package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"mypracticum/backend/service"
)

// JWTMiddleware validates a JWT and aborts with JSON on any failure.
// On success it injects a uuid.UUID under "userID" and calls Next().
func JWTMiddleware(svc *service.TokenService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Always respond as JSON
		c.Writer.Header().Set("Content-Type", "application/json")

		// 1) Bearer header
		hdr := c.GetHeader("Authorization")
		parts := strings.SplitN(hdr, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or malformed token"})
			return
		}

		// 2) Validate token
		uid, err := svc.ValidateToken(parts[1])
		if err != nil {
			var valErr service.TokenValidationError
			if errors.As(err, &valErr) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": valErr.Error()})
			} else {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "token validation failed"})
			}
			return
		}

		// 3) Authenticated! stash the UUID and move on.
		c.Set("userID", uid)
		c.Next()
	}
}
