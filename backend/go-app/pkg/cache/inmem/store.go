package inmem

import (
	"errors"
	"mypracticum/backend/pkg/cache"
	"sync"
	"time"
)

// In-memory implementation of your cache.Store interface
type Store struct {
	mu   sync.Mutex
	data map[string]entry
}

type entry struct {
	value     []byte
	expiresAt time.Time
}

// NewStore returns a Store you can inject anywhere you need cache.Store
func NewStore() cache.Store {
	s := &Store{data: make(map[string]entry)}

	// launch janitor
	go s.gcLoop(1 * time.Hour)

	return s
}

// Set stores a value for key with a TTL
func (s *Store) Set(key string, value []byte, ttl time.Duration) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[key] = entry{
		value:     value,
		expiresAt: time.Now().Add(ttl),
	}
	return nil
}

// Get returns the value or an error if missing/expired
func (s *Store) Get(key string) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.data[key]
	if !ok || time.Now().After(e.expiresAt) {
		return nil, errors.New("cache: not found or expired")
	}
	return e.value, nil
}

// Delete removes the key (optional for OTP flow)
func (s *Store) Delete(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.data, key)
	return nil
}

// gcLoop is a good janitor
func (s *Store) gcLoop(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		now := time.Now()
		s.mu.Lock()
		for k, e := range s.data {
			if now.After(e.expiresAt) {
				delete(s.data, k)
			}
		}
		s.mu.Unlock()
	}
}
