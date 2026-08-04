package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAnyRole protects a route when the authenticated user has at least
// one of the supplied roles. JWTMiddleware must run before this middleware.
func RequireAnyRole(allowed ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, exists := c.Get("roles")
		roles, ok := value.([]string)
		if !exists || !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
			return
		}

		for _, role := range roles {
			for _, permitted := range allowed {
				if role == permitted {
					c.Next()
					return
				}
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
	}
}
