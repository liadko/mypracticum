package jwt

import (
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

// Claims holds your custom data plus the standard JWT fields.
type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	jwt.RegisteredClaims
}
