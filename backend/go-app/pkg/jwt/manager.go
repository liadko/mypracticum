package jwt

import (
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

// Manager is your JWT factory and validator.
type Manager struct {
	secret []byte
	ttl    time.Duration
	issuer string
}

// NewManager creates a Manager with HMAC-SHA256, a TTL, and an issuer name.
func NewManager(secret, issuer string, ttl time.Duration) *Manager {
	return &Manager{
		secret: []byte(secret),
		issuer: issuer,
		ttl:    ttl,
	}
}

// Generate creates a signed token for the given userID.
func (m *Manager) Generate(userID uuid.UUID) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
			Issuer:    m.issuer,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// Parse takes a raw JWT string, verifies its signature and expiration,
// and returns the custom Claims if valid.
func (m *Manager) Parse(tokenStr string) (*Claims, error) {
	// 1) Parse the token into our custom Claims type
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		// 1a) Reject any token not signed with HMAC-SHA256
		if t.Method != jwt.SigningMethodHS256 {
			return nil, ErrInvalidToken
		}
		// 1b) Provide the secret key for signature verification
		return m.secret, nil
	})
	// 2) validation failed
	if err != nil {
		// 2a) check for expiration
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return nil, ErrExpiredToken
			}
		}
		// 2b) Any other error means the token is malformed or signature-invalid
		return nil, ErrInvalidToken
	}

	// 3) Assert and validate the parsed claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// 4) Success! Return the populated Claims struct
	return claims, nil
}
