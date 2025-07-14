package inmem

import (
	"mypracticum/backend/pkg/cache"
	"time"
)

// A simple “one per window” limiter that uses your Store as backing
type Limiter struct {
	store  cache.Store
	window time.Duration
}

// NewLimiter(store, window) yields a Limiter you can plug into your middleware
func NewLimiter(store cache.Store, window time.Duration) *Limiter {
	return &Limiter{store: store, window: window}
}

// Allow returns true once per window; false until TTL expires
func (l *Limiter) Allow(key string) (bool, error) {
	// If the key still exists, we’re inside the cooldown
	if _, err := l.store.Get(key); err == nil {
		return false, nil
	}
	// Otherwise set a placeholder with TTL == window
	if err := l.store.Set(key, []byte("1"), l.window); err != nil {
		return false, err
	}
	return true, nil
}
