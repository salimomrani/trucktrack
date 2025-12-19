// Staging environment configuration
export const environment = {
  production: false,
  apiUrl: 'https://api-staging.trucktrack.example.com',
  wsUrl: 'wss://api-staging.trucktrack.example.com/ws',
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
    logLevel: 'info'
  }
};
