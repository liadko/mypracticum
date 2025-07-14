package cache

// Limiter is for counting hits in a time window.
type Limiter interface {
	Allow(key string) (bool, error)
}
