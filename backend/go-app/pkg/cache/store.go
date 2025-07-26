package cache

import (
	"time"
)

// Store is a simple key→value with TTL.
type Store interface {
	Set(key string, value []byte, ttl time.Duration) error
	Get(key string) ([]byte, error)
	Delete(key string) error
}
