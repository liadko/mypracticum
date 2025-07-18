package middleware

import (
	"fmt"
	"mypracticum/backend/pkg/cache"
	"net/http"

	"github.com/gin-gonic/gin"
)

// OTPRateLimit allows 1 request per window (e.g. 2m) per IP.
// You can swap ClientIP for email if you want per-user limits.
func OTPRateLimit(limiter cache.Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// build a key for this client
		key := fmt.Sprintf("otp_rl:%s", c.ClientIP())

		ok, err := limiter.Allow(key)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "rate-limit error"})
			c.Abort()
			return
		}
		if !ok {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "please wait a couple of seconds before requesting a new code",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
