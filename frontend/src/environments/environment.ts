// Development environment configuration
// Build timestamp is injected at build time for cache busting
export const environment = {
  production: false,
  buildTimestamp: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
  apiUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8081/ws',
  map: {
    defaultCenter: {
      lat: 37.7749,
      lng: -122.4194
    },
    defaultZoom: 12,
    clusterThreshold: 10,
    updateInterval: 2000 // milliseconds between GPS updates
  },
  logging: {
    enableConsoleLogging: true,
    logLevel: 'debug'
  }
};
