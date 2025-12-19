// Production environment configuration
export const environment = {
  production: true,
  apiUrl: 'https://api.trucktrack.example.com',
  wsUrl: 'wss://api.trucktrack.example.com/ws',
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
    enableConsoleLogging: false,
    logLevel: 'error'
  }
};
