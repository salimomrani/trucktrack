// Staging environment configuration
export const environment = {
  production: false,
  apiUrl: 'https://api-staging.trucktrack.example.com',
  wsUrl: 'wss://api-staging.trucktrack.example.com/ws',
  auth: {
    tokenKey: 'truck_track_token',
    refreshTokenKey: 'truck_track_refresh_token',
    tokenExpiry: 900000, // 15 minutes in milliseconds
    refreshTokenExpiry: 2592000000 // 30 days in milliseconds
  },
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
