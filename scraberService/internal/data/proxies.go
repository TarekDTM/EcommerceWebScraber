// Package data holds the domain types for the proxy service — currently
// just the Proxy model and the round-robin manager that hands proxies out.
// Pulling this out of main() means main is only responsible for wiring
// config + HTTP, while the actual proxy-rotation logic lives here and can
// be unit tested independently of the HTTP layer.
package data

import "sync"

// Proxy represents a single proxy address and whether it's currently
// considered usable.
type Proxy struct {
	Address string `json:"address"`
	Healthy bool   `json:"healthy"`
}

// ProxyModel manages a pool of proxies and hands them out in round-robin
// order. It's safe for concurrent use — the HTTP server may call Next()
// from multiple goroutines at once (one per in-flight request).
type ProxyModel struct {
	mu      sync.Mutex
	proxies []*Proxy
	next    int
}

// NewProxyModel builds a ProxyModel from a list of proxy addresses,
// marking all of them healthy initially.
func NewProxyModel(addresses []string) *ProxyModel {
	proxies := make([]*Proxy, 0, len(addresses))
	for _, a := range addresses {
		proxies = append(proxies, &Proxy{Address: a, Healthy: true})
	}
	return &ProxyModel{proxies: proxies}
}

// Next returns the next healthy proxy in round-robin order, advancing the
// internal cursor. If no proxy is marked healthy, it falls back to cycling
// through the pool anyway rather than returning nothing — an unhealthy
// mark is a guess, not a certainty, so callers still get something to try.
func (m *ProxyModel) Next() (*Proxy, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if len(m.proxies) == 0 {
		return nil, false
	}

	start := m.next
	for i := 0; i < len(m.proxies); i++ {
		idx := (start + i) % len(m.proxies)
		p := m.proxies[idx]
		if p.Healthy {
			m.next = (idx + 1) % len(m.proxies)
			return p, true
		}
	}

	p := m.proxies[start%len(m.proxies)]
	m.next = (start + 1) % len(m.proxies)
	return p, true
}

// All returns a snapshot copy of every known proxy and its current status.
func (m *ProxyModel) All() []*Proxy {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]*Proxy, len(m.proxies))
	copy(out, m.proxies)
	return out
}

// Report marks a proxy healthy or unhealthy by address. Returns false if
// no proxy with that address is known.
func (m *ProxyModel) Report(address string, healthy bool) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, p := range m.proxies {
		if p.Address == address {
			p.Healthy = healthy
			return true
		}
	}
	return false
}

// Models bundles every data model the application needs. Right now that's
// just proxies, but this is the natural place to add e.g. a request-log
// model later without changing the application struct's shape.
type Models struct {
	Proxies *ProxyModel
}

// NewModels builds a Models struct from the given proxy address list.
func NewModels(addresses []string) Models {
	return Models{
		Proxies: NewProxyModel(addresses),
	}
}
