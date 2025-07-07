package jwt

import "github.com/golang-jwt/jwt/v4"

// Claims holds your custom data plus the standard JWT fields.
type Claims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}
