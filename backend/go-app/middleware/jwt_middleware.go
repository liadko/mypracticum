package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"mypracticum/backend/service"
)

// JWTMiddleware validates a JWT from the Authorization header and injects the userID.
func JWTMiddleware(svc *service.TokenService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) Extract and validate the Authorization header
		hdr := c.GetHeader("Authorization")
		parts := strings.SplitN(hdr, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or malformed token"})
			return
		}
		tokenStr := parts[1]

		// 2) Validate the token and get the userID
		userID, err := svc.ValidateToken(tokenStr)
		if err != nil {
			// Distinguish between invalid/expired tokens vs. internal failures
			var valErr service.TokenValidationError
			if errors.As(err, &valErr) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": valErr.Error()})
			} else {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "token validation failed"})
			}
			return
		}

		// 3) Inject into Gin context and continue
		c.Set("UserID", userID)
		c.Next()
	}
}
